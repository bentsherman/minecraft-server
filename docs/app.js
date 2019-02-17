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
	const STATUS_STOPPED = 0;
	const STATUS_STARTING = 1;
	const STATUS_RUNNING = 2;
	const STATUS_SHUTDOWN = 3;
	const STATUS_SNAPSHOT = 4;
	const STATUS_CLEANUP = 5;

	$scope.STATUS_STOPPED = STATUS_STOPPED;
	$scope.STATUS_STARTING = STATUS_STARTING;
	$scope.STATUS_RUNNING = STATUS_RUNNING;
	$scope.STATUS_SHUTDOWN = STATUS_SHUTDOWN;
	$scope.STATUS_SNAPSHOT = STATUS_SNAPSHOT;
	$scope.STATUS_CLEANUP = STATUS_CLEANUP;

	$scope.STATUS_NAMES = {};
	$scope.STATUS_NAMES[STATUS_STOPPED] = "Stopped";
	$scope.STATUS_NAMES[STATUS_STARTING] = "Starting...";
	$scope.STATUS_NAMES[STATUS_RUNNING] = "Running";
	$scope.STATUS_NAMES[STATUS_SHUTDOWN] = "Shutting down...";
	$scope.STATUS_NAMES[STATUS_SNAPSHOT] = "Creating snapshot...";
	$scope.STATUS_NAMES[STATUS_CLEANUP] = "Cleaning up...";

	$scope.STATUS_COLORS = {};
	$scope.STATUS_COLORS[STATUS_STOPPED] = "success";
	$scope.STATUS_COLORS[STATUS_STARTING] = "warning";
	$scope.STATUS_COLORS[STATUS_RUNNING] = "success";
	$scope.STATUS_COLORS[STATUS_SHUTDOWN] = "warning";
	$scope.STATUS_COLORS[STATUS_SNAPSHOT] = "warning";
	$scope.STATUS_COLORS[STATUS_CLEANUP] = "warning";

	$scope.server_name = "minecraft-server";
	$scope.status = -1;
	$scope.droplet = {};
	$scope.snapshot = {};

	const sleep = function(ms) {
	  return new Promise(resolve => $timeout(resolve, ms));
	}

	$scope.initialize = async function(api_key) {
		api.authenticate(api_key);

		// query droplets and snapshots
		let promise1 = api.Droplet.query();
		let promise2 = api.Snapshot.query();

		// get the first droplet with the server name
		$scope.droplet = (await promise1)
			.droplets
			.find(function(droplet) {
				return (droplet.name === $scope.server_name);
			});

		// get the first snapshot with the server name
		$scope.snapshot = (await promise2)
			.snapshots
			.find(function(snapshot) {
				return (snapshot.name === $scope.server_name);
			});

		// determine the server status
		if ( $scope.droplet !== undefined && $scope.droplet.status === "new" ) {
			$scope.status = STATUS_STARTING;
		}
		else if ( $scope.droplet !== undefined && $scope.droplet.status === "active" ) {
			$scope.status = STATUS_RUNNING;
		}
		else {
			$scope.status = STATUS_STOPPED;
		}

		$scope.$digest();
	};

	$scope.start = async function(snapshot) {
		// query SSH keys
		let keys = (await api.Key.query())
			.ssh_keys
			.map(function(key) {
				return key.id;
			});

		// create droplet
		let result = await api.Droplet.create(snapshot.name, "nyc3", "s-1vcpu-2gb", snapshot.id, keys);
		let droplet_id = result.droplet.id;

		$scope.status = STATUS_STARTING;

		// wait for droplet creation to complete
		while ( true ) {
			let droplet = (await api.Droplet.get(droplet_id));

			if ( droplet.status === "active" ) {
				$scope.droplet = droplet;
				break;
			}
			else {
				await sleep(2000);
			}
		}

		$scope.status = STATUS_RUNNING;
		$scope.$digest();
	};

	$scope.stop = async function(droplet) {
		if ( !confirm("Are you sure you want to stop the Minecraft server?") ) {
			return;
		}

		// attempt to shutdown the droplet
		$scope.status = STATUS_SHUTDOWN;

		let shutdownResult = await api.DropletAction.shutdown(droplet.id);

		// wait for droplet to power off
		while ( true ) {
			let result = await api.Droplet.get(droplet.id);
			let status = result.droplet.status;

			if ( status === "off" ) {
				break;
			}
			else {
				await sleep(2000);
			}
		}

		// create snapshot of droplet
		$scope.status = STATUS_SNAPSHOT;

		let snapshotResult = await api.DropletAction.snapshot(droplet.id, droplet.name);
		let action_id = snapshotResult.action.id;

		// wait for snapshot to complete
		while ( true ) {
			let result = await api.DropletAction.get(droplet.id, action_id);
			let status = result.action.status;

			if ( status === "completed" ) {
				break;
			}
			else if ( status === "errored" ) {
				$scope.status = "Error: snapshot failed";
				$scope.$digest();
				return;
			}
			else {
				await sleep(2000);
			}
		}

		// destroy droplet and old snapshot
		$scope.status = STATUS_CLEANUP;

		let promise1 = api.Droplet.delete(droplet.id);
		let promise2 = api.Snapshot.delete(droplet.image.id);

		try {
			await promise1;
			await promise2;

			$scope.status = STATUS_STOPPED;
			$scope.$digest();
		}
		catch ( err ) {
			$scope.status = "Error: cleanup failed";
			$scope.$digest();

			console.log(err);
		}
	};
}]);
