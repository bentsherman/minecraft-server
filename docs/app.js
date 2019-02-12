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

	this.Droplet.create = function(name, region, size, snapshot_id) {
		return httpRequest("post", "/v2/droplets", {}, {
			"name": name,
			"region": region,
			"size": size,
			"image": snapshot_id
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
}]);

app.controller("HomeCtrl", ["$scope", "$timeout", "api", function($scope, $timeout, api) {
	$scope.status = "";
	$scope.droplets = [];
	$scope.snapshots = [];

	const sleep = function(ms) {
	  return new Promise(resolve => $timeout(resolve, ms));
	}

	$scope.initialize = async function(api_key) {
		api.authenticate(api_key);

		let promise1 = api.Droplet.query();
		let promise2 = api.Snapshot.query();

		$scope.droplets = (await promise1).droplets;
		$scope.snapshots = (await promise2).snapshots;
	};

	$scope.start = async function(snapshot) {
		// create droplet
		let result = await api.Droplet.create(snapshot.name, "nyc3", "s-1vcpu-1gb", snapshot.id);
		let droplet_id = result.droplet.id;

		$scope.status = "Starting...";

		// wait for droplet creation to complete
		while ( true ) {
			let result = await api.Droplet.get(droplet_id);
			let status = result.droplet.status;

			if ( status === "active" ) {
				break;
			}
			else {
				await sleep(3000);
			}
		}

		$scope.status = "Running";
		$scope.$digest();
	};

	$scope.stop = async function(droplet) {
		if ( !confirm("Are you sure you want to stop the Minecraft server?") ) {
			return;
		}

		// attempt to shutdown the droplet
		$scope.status = "Shutting down...";

		let shutdownResult = await api.DropletAction.shutdown(droplet.id);

		// wait for droplet to power off
		while ( true ) {
			let result = await api.Droplet.get(droplet.id);
			let status = result.droplet.status;

			if ( status === "off" ) {
				break;
			}
			else {
				await sleep(1000);
			}
		}

		// create snapshot of droplet
		$scope.status = "Creating snapshot...";

		let snapshotResult = await api.DropletAction.snapshot(droplet.id, droplet.name);
		let action_id = snapshotResult.action.id;

		// wait for snapshot to complete
		while ( true ) {
			let result = await api.DropletAction.get(droplet.id, action_id);
			let status = result.action.status;

			if ( status === "completed" ) {
				break;
			}
			else {
				await sleep(3000);
			}
		}

		// destroy droplet and old snapshot
		$scope.status = "Cleaning up...";

		let promise1 = api.Droplet.delete(droplet.id);
		let promise2 = api.Snapshot.delete(droplet.image.id);

		await promise1;
		await promise2;

		$scope.status = "Stopped";
		$scope.$digest();
	};
}]);
