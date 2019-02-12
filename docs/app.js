"use strict";

var app = angular.module("app", []);

app.config(["$compileProvider", function($compileProvider) {
	$compileProvider.debugInfoEnabled(false);
}]);

app.service("api", ["$http", "$q", function($http, $q) {
	var self = this;

	var httpRequest = function(method, url, params, data) {
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

	this.Droplet.shutdown = function(id) {
		return httpRequest("post", "/v2/droplets/" + id + "/actions", {}, { "type": "shutdown" });
	};

	this.Droplet.remove = function(id) {
		return httpRequest("delete", "/v2/droplets/" + id);
	};

	this.Snapshot = {};

	this.Snapshot.query = function() {
		return httpRequest("get", "/v2/snapshots?resource_type=droplet");
	};
}]);

app.controller("HomeCtrl", ["$scope", "$q", "api", function($scope, $q, api) {
	$scope.droplets = [];
	$scope.snapshots = [];

	$scope.initialize = function(api_key) {
		api.authenticate(api_key);

		$q.all([
			api.Droplet.query(),
			api.Snapshot.query()
		]).then(function(results) {
			$scope.droplets = results[0].droplets;
			$scope.snapshots = results[1].snapshots;
		});
	};

	$scope.start = function(snapshot_id) {
		api.Droplet.create(snapshot_id)
			.then(function() {
				console.log("Successfully started server.");
			});
	};

	$scope.stop = function(droplet_id, snapshot_id) {
		if ( !confirm("Are you sure you want to stop the Minecraft server?") ) {
			return;
		}
	};
}]);
