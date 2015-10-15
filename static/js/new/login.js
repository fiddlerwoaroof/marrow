window.URL = window.URL || window.webkitURL;
var loginModule = angular.module('marrowLogin', ['ngResource','ngRoute','angulartics',
                                 'angulartics.google.analytics', 'angulartics.piwik']);

loginModule.controller('LoginCtrl', function ($scope,$http,$route,$window) {
  $scope.message = '';

  var check_login = function () {
    injector = angular.injector(['ng']);
    $http = injector.get('$http');
    return $http.get("/api/user/check").success(function(is_loggedon) {
      if (is_loggedon.result === true) {
        angular.element(document.body).addClass('is-logged-on');
      }
    });
  };

  //check_login().success(
  //  function(is_loggedon) {
  //    if (is_loggedon.result) { $window.location.href = '/';}
  //});

  $scope.newuser = function () {
    var username = $scope.username;
    var password = $scope.password;
    var postObj = {"username":username, "password": password};
    $http.post("/api/user/add", postObj)
    .success(function(added_user) {
      if (added_user.status === true) {$window.location.href = '/';}
      else {$scope.message = added_user.message;}
    });
  };

  $scope.login = function () {
    var username = $scope.username;
    var password = $scope.password;

    $http.post("/api/user/login", {"username":username, "password":password})
    .success(
      function (login_succeeded) {
        var el = angular.element(document.querySelector('#login_form'));
        if (login_succeeded.status === true) {$window.location.href = '/';}
        else {$scope.message = login_succeeded.message;}
    });
  };
});
