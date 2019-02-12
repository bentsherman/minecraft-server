"use strict";

var app = angular.module("app", []);

app.config(["$compileProvider", function($compileProvider) {
	$compileProvider.debugInfoEnabled(false);
}]);

app.service("api", ["$http", "$q", function($http, $q) {
	var httpRequest = function(method, url, params, data) {
		return $http({
			method: method,
			url: "https://api.digitalocean.com" + url,
			params: params,
			data: data
		}).then(function(res) {
			return res.data;
		}, function(res) {
			return $q.reject(res.data);
		});
	};

	this.Droplet = {};

	this.Droplet.query = function() {
		return httpRequest("get", "/v2/droplets");
	};

	this.Droplet.get = function(id) {
		return httpRequest("get", "/v2/droplets/" + id);
	};

	this.Droplet.shutdown = function(id) {
		return httpRequest("post", "/v2/droplets/" + id + "/actions", {}, { type: "shutdown" });
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

	$scope.start = function(snapshot_id) {
	};

	$scope.stop = function(droplet_id, snapshot_id) {
		if ( !confirm("Are you sure you want to stop the Minecraft server?") ) {
			return;
		}
	};

	// initialize
	$q.all([
		api.Droplet.query(),
		api.Snapshot.query()
	]).then(function(results) {
		$scope.droplets = results[0];
		$scope.snapshots = results[1];
	});
}]);
