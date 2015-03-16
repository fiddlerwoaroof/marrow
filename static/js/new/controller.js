var marrowApp = angular.module('marrowApp', ['ngRoute']);


marrowApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/random', {templateUrl: 'partials/random.html', controller: 'RandomMarrowCtrl'}).
      when('/subscriptions', {templateUrl: 'partials/subscription.html', controller: 'SubscriptionCtrl'}).
      when('/u/:user', {templateUrl: 'partials/random.html', controller: 'UserCtrl'}).
      when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'}).
      when('/', {templateUrl: 'partials/default.html', controller: 'MarrowCtrl'});
  }
]);

marrowApp.config(['$locationProvider',
  function($locationProvider) {
    $locationProvider.html5Mode(true);
  }
]);

marrowApp.controller('LoginCtrl', function ($scope,$http,$route,$location) {
  $http.get("/api/user/check")
  .success(
    function(is_loggedon) {
      is_loggedon = JSON.parse(is_loggedon);
      if (is_loggedon) { $location.url('/') };
  });

  $scope.newuser = function () {
    var username = $scope.username;
    var password = $scope.password;
    var postObj = {"username":username, "password": password}
    console.log(postObj);
    $http.post("/api/user/add", postObj)
    .success(function(added_user) {
      added_user = JSON.parse(added_user);
      if(added_user === true) {$location.url('/');};
    });
  };

  $scope.login = function () {
    var username = $scope.username;
    var password = $scope.password;

    $http.post("/api/user/login", {"username":username, "password":password})
    .success(
      function (login_succeeded) {
        login_succeeded = JSON.parse(login_succeeded);
        var el = angular.element(document.querySelector('#login_form'));
        if (login_succeeded === true) {el.removeClass('hidden')};
        $location.url('/');
    });
  };
});

function controllerFactory(name, getendpoint, cb, afterGet) {
  marrowApp.controller(name, function ($scope,$http,$location) {
    $scope.url = "";
    $scope.title = "";

    $http.get("/api/user/check").success(
      function(is_loggedon) {
        is_loggedon = JSON.parse(is_loggedon);
        if (!is_loggedon) { $location.url('/login') };
    }).finally(function (){

      $http.get(getendpoint).success(function(data) {
        $scope.sectionTitle = data.sectionTitle;
        $scope.bone = data.marrow;
        if (afterGet !== undefined) {afterGet($scope,$http);};
      });

      if (cb !== undefined) {cb($scope,$http);};
    });
  });
};

function subscribe($http,$scope) {
  return function () {
    var postObj = {"to":$scope.sectionTitle};
    $http.post('/api/bones/subscribe', postObj);
    var el = angular.element(document.querySelector('#subscribe'));
    el.addClass('hidden');
  }
}

marrowApp.controller('UserCtrl', function ($scope,$http,$routeParams) {
  $scope.url = "";
  $scope.title = "";

  var user = $routeParams.user;

  $http.get('/api/user/follows/'+user).success(function(result) {
      result = JSON.parse(result);
      var el = angular.element(document.querySelector('#subscribe'));
      if (result === false) {el.removeClass('hidden')};
  });

  $scope.subscribe = subscribe($http, $scope);
  $http.get('/api/bones/u/'+user).success(function(data) {
    $scope.sectionTitle = data.sectionTitle;
    $scope.bone = data.marrow;
  });
});

controllerFactory('RandomMarrowCtrl', '/api/bones/random',
  function($scope,$http) {
    $scope.subscribe = subscribe($http, $scope);
  },
  function ($scope,$http) {
    $http.get('/api/user/follows/'+$scope.sectionTitle).success(function(result) {
      result = JSON.parse(result);
      var el = angular.element(document.querySelector('#subscribe'));
      if (result === false) {el.removeClass('hidden')};
  });
});

controllerFactory('SubscriptionCtrl', '/api/bones/subscriptions');

marrowApp.controller('SidebarCtrl', function ($scope,$http,$location,$route) {
  $scope.random = function() {
    if ($location.url() !== '/random') { $location.url('/random') }
    else { $route.reload() };
  };

  $scope.logout = function() {
    $http.get('/api/user/logout').finally(function() { $location.url('/login'); });
  };
});

controllerFactory('MarrowCtrl', '/api/bones', function($scope,$http) {
  $scope.addLink = function() {
    var postObj = {"url":$scope.url, "title":$scope.title};
    $http.post('/api/bones/add', postObj).success(function(success) {
      if (success) {
        $scope.bone.unshift(postObj);
        $scope.url = "";
      }
    });
  };
});
