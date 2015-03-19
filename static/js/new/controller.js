var marrowApp = angular.module('marrowApp', ['ngRoute']);

function deleteLink($scope) {
  injector = angular.injector(['ng']);
  $http = injector.get('$http');
  return function (linkid) {
    $http.delete('/api/bones/link/'+linkid).success(function (deleted) {
      deleted = JSON.parse(deleted);
      if (deleted === true) { $scope.update(); }
    });
  };
}

function check_login() {
  injector = angular.injector(['ng']);
  $http = injector.get('$http');
  return $http.get("/api/user/check").success(function(is_loggedon) {
    is_loggedon = JSON.parse(is_loggedon);
    console.log(is_loggedon);
    if (is_loggedon === true) {
      angular.element(document.body).addClass('is-logged-on');
    }
  });
}

// from http://stackoverflow.com/questions/15324039/how-to-create-a-url-for-link-helper-in-angularjjs
marrowApp.run(function($route, $rootScope) {
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


marrowApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/random', {templateUrl: 'partials/random.html', controller: 'RandomMarrowCtrl'}).
      when('/subscriptions', {templateUrl: 'partials/subscription.html', controller: 'SubscriptionCtrl'}).
      when('/user/:user', {template: '<div ng-include="templateUrl">Loading...</div>', controller: 'UserCtrl'}).
      
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
  $scope.message = '';

  check_login().success(
    function(is_loggedon) {
      is_loggedon = JSON.parse(is_loggedon);
      if (is_loggedon) { $location.url('/');}
  });

  $scope.newuser = function () {
    var username = $scope.username;
    var password = $scope.password;
    var postObj = {"username":username, "password": password};
    console.log(postObj);
    $http.post("/api/user/add", postObj)
    .success(function(added_user) {
      if (added_user.status === true) {$location.url('/');}
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
        if (login_succeeded.status === true) {$location.url('/');}
        else {$scope.message = login_succeeded.message;}
    });
  };
});

function controllerFactory(name, getendpoint, cb, afterGet) {
  marrowApp.controller(name, function ($scope,$http,$location,$route) {
    $scope.url = "";
    $scope.title = "";
    $scope.sectionTitle = "";

    $scope.update = function() {
      return $http.get(getendpoint).success(function(data) {
        $scope.sectionTitle = data.sectionTitle;
        $scope.bone = data.marrow;
      });
    };

    check_login().success(
      function(is_loggedon) {
        is_loggedon = JSON.parse(is_loggedon);
        if (!is_loggedon) { $location.url('/login');}
    }).finally(function (){

      $scope.update().success(function(data) {
        $scope.sectionTitle = data.sectionTitle;
        $scope.bone = data.marrow;
        if (afterGet !== undefined) {afterGet($scope,$http,$route);}
      });

      if (cb !== undefined) {cb($scope,$http,$route);}
    });
  });
}

function unsubscribe($http,$scope) {
  return function () {
    var postObj = {"from":$scope.sectionTitle};
    $http.post('/api/bones/unsubscribe', postObj);

    var subscribeform = angular.element(document.querySelector('#subscribe'));
    subscribeform.removeClass('is-hidden');
    var unsubscribeform = angular.element(document.querySelector('#unsubscribe'));
    unsubscribeform.addClass('is-hidden');
  };
}

function subscribe($http,$scope) {
  return function () {
    var postObj = {"to":$scope.sectionTitle};
    $http.post('/api/bones/subscribe', postObj);

    var subscribeform = angular.element(document.querySelector('#subscribe'));
    subscribeform.addClass('is-hidden');
    var unsubscribeform = angular.element(document.querySelector('#unsubscribe'));
    unsubscribeform.removeClass('is-hidden');
  };
}

marrowApp.controller('UserCtrl', function ($scope,$http,$routeParams) {
  check_login();
  $scope.url = "";
  $scope.title = "";
  $scope.unsubscribe = unsubscribe($http, $scope);
  $scope.subscribe = subscribe($http, $scope);
  $scope.delete = deleteLink($scope);

  $scope.addLink = function(url) {
    console.log(url);
    var postObj = {"url":url, "title":$scope.title};
    $http.post('/api/bones/add', postObj).success(function(data) {
      if (data.success) {
        //postObj.id = data.id;
        $scope.update();
        $scope.url = "";
      }
    });
  };

  q = $scope;


  var getendpoint = '/api/bones/u/'+$routeParams.user;
  $scope.update = function() {
    console.log('updating');
    return $http.get(getendpoint).success(function(data) {
      $scope.sectionTitle = data.sectionTitle;
      $scope.bone = data.marrow;
    });
  };

  var user = $routeParams.user;

  $http.get('/api/user/follows/'+user).success(function(result) {
      if (result.me === user) {
        $scope.templateUrl = "/partials/default.html";
      } else {
        $scope.templateUrl = "/partials/random.html";
        var unsubscribeform = angular.element(document.querySelector('#unsubscribe'));
        console.log(unsubscribeform);
        if (result.follows === true) {unsubscribeform.removeClass('is-hidden');}

        var subscribeform = angular.element(document.querySelector('#subscribe'));
        if (result.follows === false) {subscribeform.removeClass('is-hidden');}
      }
  }).success(function (){
    $http.get(getendpoint).success(function(data) {
      $scope.sectionTitle = data.sectionTitle;
      $scope.bone = data.marrow;
    });
  });

});

controllerFactory('RandomMarrowCtrl', '/api/bones/random',
  function($scope,$http) {
    $scope.subscribe = subscribe($http, $scope);
    $scope.unsubscribe = unsubscribe($http, $scope);
  },
  function ($scope,$http) {
    $http.get('/api/user/follows/'+$scope.sectionTitle).success(function(result) {
      var unsubscribeform = angular.element(document.querySelector('#unsubscribe'));
      if (result.follows === true) {unsubscribeform.removeClass('is-hidden');}

      var subscribeform = angular.element(document.querySelector('#subscribe'));
      console.log(subscribeform);
      if (result.follows === false) {subscribeform.removeClass('is-hidden');}
  });
});

controllerFactory('SubscriptionCtrl', '/api/bones/subscriptions');

marrowApp.controller('SidebarCtrl', function ($scope,$http,$location,$route) {
  $scope.random = function() {
    if ($location.url() !== '/random') { $location.url('/random'); }
    else { $route.reload(); }
  };

  $scope.logout = function() {
    $http.get('/api/user/logout').success(function() {
      $location.url('/login');
    });
  };
});

controllerFactory('MarrowCtrl', '/api/bones', function($scope,$http,$route) {
  $scope.delete = deleteLink($scope);

  function addLink($scope) {
    injector = angular.injector(['ng']);
    $http = injector.get('$http');
    return function(url) {
      var postObj = {"url":url, "title":$scope.title};
      $http.post('/api/bones/add', postObj).success(function(data) {
        if (data.success) { $scope.update(); }
      });
    };
  }

  $scope.addLink = addLink($scope);
});
