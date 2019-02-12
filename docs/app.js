"use strict";

const app = angular.module("app", []);

app.config(["$compileProvider", function($compileProvider) {
	$compileProvider.debugInfoEnabled(false);
}]);

app.service("api", ["$http", "$q", function($http, $q) {
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
			return $q.reject(res.data);
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

	this.Droplet.create = function(snapshot_id) {
		return httpRequest("post", "/v2/droplets", {}, {
			"name": "minecraft-server",
			"region": "nyc3",
			"size": "s-1vcpu-1gb",
			"image": snapshot_id
		});
	};

	this.Droplet.remove = function(id) {
		return httpRequest("delete", "/v2/droplets/" + id);
	};

	this.DropletAction = {};

	this.DropletAction.shutdown = function(droplet_id) {
		return httpRequest("post", "/v2/droplets/" + droplet_id + "/actions", {}, { "type": "shutdown" });
	};

	this.DropletAction.power_off = function(droplet_id) {
		return httpRequest("post", "/v2/droplets/" + droplet_id + "/actions", {}, { "type": "power_off" });
	};

	this.DropletAction.get = function(droplet_id, id) {
		return httpRequest("get", "/v2/droplets/" + droplet_id + "/actions/" + id);
	};

	this.Snapshot = {};

	this.Snapshot.query = function() {
		return httpRequest("get", "/v2/snapshots?resource_type=droplet");
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

		const promise1 = api.Droplet.query();
		const promise2 = api.Snapshot.query();

		$scope.droplets = (await promise1).droplets;
		$scope.snapshots = (await promise2).snapshots;
	};

	$scope.start = async function(snapshot_id) {
		await api.Droplet.create(snapshot_id);

		$scope.status = "Starting...";
	};

	$scope.stop = async function(droplet_id, snapshot_id) {
		if ( !confirm("Are you sure you want to stop the Minecraft server?") ) {
			return;
		}

		// attempt to shutdown the droplet
		const result = await api.DropletAction.shutdown(droplet_id);
		const action_id = result.action.id;

		$scope.status = "Shutting down...";

		while ( true ) {
			const result = await api.DropletAction.get(droplet_id, action_id);
			const status = result.action.status;

			if ( status === "completed" ) {
				break;
			}
			else if ( status === "errored" ) {
				$scope.status = "Error: shutdown failed"
				break;
			}
			else {
				await sleep(1000);
			}
		}

		// attempt to power off the droplet

		// create snapshot of droplet

		// destroy old snapshot and droplet
	};
}]);
