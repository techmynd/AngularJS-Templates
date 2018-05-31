console.log("demo");
var demo = angular.module('demo', []);

demo.controller("CourseController", ['$scope', function($scope) {

	$scope.courses = [
		{ 1, "Java" },
		{ 2, "iOS" },
		{ 3, "Web Designing"} 
	];

}]);