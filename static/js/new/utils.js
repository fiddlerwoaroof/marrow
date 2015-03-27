var module = angular.module('marrowApp.utils', []);

module.run(function($route, $rootScope) {
  $rootScope.path = function(controller, params) {
    // Iterate over all available routes
    var baseUrl = document.getElementsByTagName('base')[0].href.replace(/\/$/, '');
    for(var path in $route.routes) {
      var pathController = $route.routes[path].controller;
      if(pathController == controller) { // Route found
        var result = path;
        // Construct the path with given parameters in it
        for(var param in params) {
          result = result.replace(':' + param, params[param]);
        }
        return baseUrl + result;
      }
    }
    // No such controller in route definitions
    return undefined;
  };
});
