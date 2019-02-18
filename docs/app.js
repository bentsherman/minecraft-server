"use strict";

const app = angular.module("app", []);

app.config(["$compileProvider", function($compileProvider) {
	$compileProvider.debugInfoEnabled(false);
}]);

app.service("api", ["$http", function($http) {
	const self = this;

	const httpRequest = function(method, url, params, data) {
		return $http({
			method: method,
			headers: {
				"Authorization": "Bearer " + self.api_key
			},
			url: "https://api.digitalocean.com" + url,
			params: params,
			data: data
		}).then(function(res) {
			return res.data;
		}, function(res) {
			return Promise.reject(res.data);
		});
	};

	this.authenticate = function(api_key) {
		self.api_key = api_key;
	};

	this.Droplet = {};

	this.Droplet.query = function() {
		return httpRequest("get", "/v2/droplets");
	};

	this.Droplet.get = function(id) {
		return httpRequest("get", "/v2/droplets/" + id);
	};

	this.Droplet.create = function(name, region, size, image, ssh_keys) {
		return httpRequest("post", "/v2/droplets", {}, {
			"name": name,
			"region": region,
			"size": size,
			"image": image,
			"ssh_keys": ssh_keys
		});
	};

	this.Droplet.delete = function(id) {
		return httpRequest("delete", "/v2/droplets/" + id);
	};

	this.DropletAction = {};

	this.DropletAction.shutdown = function(droplet_id) {
		return httpRequest("post", "/v2/droplets/" + droplet_id + "/actions", {}, { "type": "shutdown" });
	};

	this.DropletAction.power_off = function(droplet_id) {
		return httpRequest("post", "/v2/droplets/" + droplet_id + "/actions", {}, { "type": "power_off" });
	};

	this.DropletAction.snapshot = function(droplet_id, name) {
		return httpRequest("post", "/v2/droplets/" + droplet_id + "/actions", {}, { "type": "snapshot", "name": name });
	};

	this.DropletAction.get = function(droplet_id, id) {
		return httpRequest("get", "/v2/droplets/" + droplet_id + "/actions/" + id);
	};

	this.Snapshot = {};

	this.Snapshot.query = function() {
		return httpRequest("get", "/v2/snapshots?resource_type=droplet");
	};

	this.Snapshot.delete = function(id) {
		return httpRequest("delete", "/v2/snapshots/" + id);
	};

	this.Key = {};

	this.Key.query = function() {
		return httpRequest("get", "/v2/account/keys");
	};
}]);

app.controller("HomeCtrl", ["$scope", "$timeout", "api", function($scope, $timeout, api) {
	// define status codes
	const STATUS_STOPPED = 0;
	const STATUS_STARTUP = 1;
	const STATUS_RUNNING = 2;
	const STATUS_SHUTDOWN = 3;
	const STATUS_SNAPSHOT = 4;
	const STATUS_CLEANUP = 5;
	const STATUS_ERROR_QUERY = 6;
	const STATUS_ERROR_SERVER_NOT_FOUND = 7;
	const STATUS_ERROR_STARTUP = 8;
	const STATUS_ERROR_SHUTDOWN = 9;
	const STATUS_ERROR_SNAPSHOT = 10;
	const STATUS_ERROR_CLEANUP = 11;

	// define status names
	const STATUS_NAMES = {};
	STATUS_NAMES[STATUS_STOPPED] = "Stopped";
	STATUS_NAMES[STATUS_STARTUP] = "Starting...";
	STATUS_NAMES[STATUS_RUNNING] = "Running";
	STATUS_NAMES[STATUS_SHUTDOWN] = "Shutting down...";
	STATUS_NAMES[STATUS_SNAPSHOT] = "Creating snapshot...";
	STATUS_NAMES[STATUS_CLEANUP] = "Cleaning up...";
	STATUS_NAMES[STATUS_ERROR_QUERY] = "Status query failed";
	STATUS_NAMES[STATUS_ERROR_SERVER_NOT_FOUND] = "Server not found";
	STATUS_NAMES[STATUS_ERROR_STARTUP] = "Startup failed";
	STATUS_NAMES[STATUS_ERROR_SHUTDOWN] = "Shutdown failed";
	STATUS_NAMES[STATUS_ERROR_SNAPSHOT] = "Snapshot failed";
	STATUS_NAMES[STATUS_ERROR_CLEANUP] = "Cleanup failed";

	// define status colors
	const STATUS_COLORS = {};
	STATUS_COLORS[STATUS_STOPPED] = "success";
	STATUS_COLORS[STATUS_STARTUP] = "warning";
	STATUS_COLORS[STATUS_RUNNING] = "success";
	STATUS_COLORS[STATUS_SHUTDOWN] = "warning";
	STATUS_COLORS[STATUS_SNAPSHOT] = "warning";
	STATUS_COLORS[STATUS_CLEANUP] = "warning";
	STATUS_COLORS[STATUS_ERROR_QUERY] = "danger";
	STATUS_COLORS[STATUS_ERROR_SERVER_NOT_FOUND] = "danger";
	STATUS_COLORS[STATUS_ERROR_STARTUP] = "danger";
	STATUS_COLORS[STATUS_ERROR_SHUTDOWN] = "danger";
	STATUS_COLORS[STATUS_ERROR_SNAPSHOT] = "danger";
	STATUS_COLORS[STATUS_ERROR_CLEANUP] = "danger";

	// add status codes, names, and colors to scope
	$scope.STATUS_STOPPED = STATUS_STOPPED;
	$scope.STATUS_STARTUP = STATUS_STARTUP;
	$scope.STATUS_RUNNING = STATUS_RUNNING;
	$scope.STATUS_SHUTDOWN = STATUS_SHUTDOWN;
	$scope.STATUS_SNAPSHOT = STATUS_SNAPSHOT;
	$scope.STATUS_CLEANUP = STATUS_CLEANUP;
	$scope.STATUS_ERROR_QUERY = STATUS_ERROR_QUERY;
	$scope.STATUS_ERROR_SERVER_NOT_FOUND = STATUS_ERROR_SERVER_NOT_FOUND;
	$scope.STATUS_ERROR_STARTUP = STATUS_ERROR_STARTUP;
	$scope.STATUS_ERROR_SHUTDOWN = STATUS_ERROR_SHUTDOWN;
	$scope.STATUS_ERROR_SNAPSHOT = STATUS_ERROR_SNAPSHOT;
	$scope.STATUS_ERROR_CLEANUP = STATUS_ERROR_CLEANUP;
	$scope.STATUS_NAMES = STATUS_NAMES;
	$scope.STATUS_COLORS = STATUS_COLORS;

	$scope.server_name = "minecraft-server";
	$scope.status = -1;
	$scope.droplet = {};
	$scope.snapshot = {};

	const sleep = function(ms) {
	  return new Promise(resolve => $timeout(resolve, ms));
	}

	const query = async function(server_name) {
		try {
			// query droplets and snapshots
			let promise1 = api.Droplet.query();
			let promise2 = api.Snapshot.query();

			// get the first droplet with the server name
			let droplet = (await promise1)
				.droplets
				.find(function(droplet) {
					return (droplet.name === server_name);
				});

			// get the first snapshot with the server name
			let snapshot = (await promise2)
				.snapshots
				.find(function(snapshot) {
					return (snapshot.name === server_name);
				});

			// return droplet and snapshot
			return [droplet, snapshot];
		}
		catch ( err ) {
			console.log(err);
			throw STATUS_ERROR_QUERY;
		}
	};

	const create_droplet = async function(snapshot) {
		try {
			// query SSH keys
			let keys = (await api.Key.query())
				.ssh_keys
				.map(function(key) {
					return key.id;
				});

			// create droplet
			let droplet = (await api.Droplet.create(snapshot.name, "nyc3", "s-1vcpu-2gb", snapshot.id, keys)).droplet;
			let droplet_id = droplet.id;

			// wait for droplet creation to complete
			while ( true ) {
				let droplet = (await api.Droplet.get(droplet_id)).droplet;

				if ( droplet.status === "active" ) {
					$scope.droplet = droplet;
					break;
				}
				else {
					await sleep(2000);
				}
			}
		}
		catch ( err ) {
			console.log(err);
			throw STATUS_ERROR_STARTUP;
		}
	};

	const shutdown = async function(droplet_id) {
		try {
			// shutdown the droplet
			let action = (await api.DropletAction.shutdown(droplet_id)).action;

			// wait for droplet to power off
			while ( true ) {
				let droplet = (await api.Droplet.get(droplet_id)).droplet;

				if ( droplet.status === "off" ) {
					break;
				}
				else {
					await sleep(2000);
				}
			}
		}
		catch ( err ) {
			console.log(err);
			throw STATUS_ERROR_SHUTDOWN;
		}
	};

	const create_snapshot = async function(droplet) {
		try {
			// create snapshot of the droplet
			let action = (await api.DropletAction.snapshot(droplet.id, droplet.name)).action;
			let action_id = action.id;

			// wait for snapshot to complete
			while ( true ) {
				let action = (await api.DropletAction.get(droplet.id, action_id)).action;

				if ( action.status === "completed" ) {
					break;
				}
				else if ( action.status === "errored" ) {
					throw new Error();
				}
				else {
					await sleep(2000);
				}
			}
		}
		catch ( err ) {
			console.log(err);
			throw STATUS_ERROR_SNAPSHOT;
		}
	};

	const cleanup = async function(droplet) {
		try {
			let promises = [
				api.Droplet.delete(droplet.id),
				api.Snapshot.delete(droplet.image.id)
			];

			await Promise.all(promises);
		}
		catch ( err ) {
			console.log(err);
			throw STATUS_ERROR_CLEANUP;
		}
	};

	$scope.initialize = async function(api_key, server_name) {
		try {
			// set the API key
			api.authenticate(api_key);

			// query droplets and snapshots
			let [droplet, snapshot] = await query(server_name);

			// determine the server status
			if ( !droplet && !snapshot ) {
				$scope.status = STATUS_ERROR_SERVER_NOT_FOUND;
			}
			else if ( !droplet ) {
				$scope.status = STATUS_STOPPED;
			}
			else if ( droplet.status === "new" ) {
				$scope.status = STATUS_STARTUP;
			}
			else if ( droplet.status === "active" ) {
				$scope.status = STATUS_RUNNING;
			}

			$scope.droplet = droplet;
			$scope.snapshot = snapshot;
			$scope.$digest();
		}
		catch ( err_status ) {
			$scope.status = err_status;
			$scope.$digest();
		}
	};

	$scope.start = async function(snapshot) {
		try {
			// create the droplet from snapshot
			$scope.status = STATUS_STARTUP;

			await create_droplet(snapshot);

			$scope.status = STATUS_RUNNING;
			$scope.$digest();
		}
		catch ( err_status ) {
			$scope.status = err_status;
			$scope.$digest();
		}
	};

	$scope.stop = async function(droplet) {
		if ( !confirm("Are you sure you want to stop the Minecraft server?") ) {
			return;
		}

		try {
			// shutdown the droplet
			$scope.status = STATUS_SHUTDOWN;

			await shutdown(droplet.id);

			// create snapshot of the droplet
			$scope.status = STATUS_SNAPSHOT;

			await create_snapshot(droplet);

			// destroy droplet and old snapshot
			$scope.status = STATUS_CLEANUP;

			await cleanup(droplet);

			// reset droplet and snapshot
			let [_, snapshot] = await query(droplet.name);

			$scope.droplet = null;
			$scope.snapshot = snapshot;

			$scope.status = STATUS_STOPPED;
			$scope.$digest();
		}
		catch ( err_status ) {
			$scope.status = err_status;
			$scope.$digest();
		}
	};
}]);
