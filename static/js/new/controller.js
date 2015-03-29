var marrowApp = angular.module('marrowApp',
                               ['ngRoute', 'marrowApp.services', 'marrowApp.directives', 'marrowApp.utils',
                                'marrowApp.directives.boneList']);

var compareTo = function() { return {
  require: "ngModel",
  scope: { otherModelValue: "=compareTo" },
  link: function(scope, element, attributes, ngModel) {
    ngModel.$validators.compareTo = function(modelValue) {
      return modelValue == scope.otherModelValue;
    };
    scope.$watch("otherModelValue", function() {
      ngModel.$validate();
    });
  }
};};

marrowApp.directive("compareTo", compareTo);

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

marrowApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'}).
      when('/random', {templateUrl: 'partials/random.html', controller: 'RandomMarrowCtrl'}).
      when('/settings', {templateUrl: 'partials/user-settings.html', controller: 'UserSettingCtrl'}).
      when('/subscriptions', {templateUrl: 'partials/subscription.html', controller: 'SubscriptionCtrl'}).
      when('/', {templateUrl: 'partials/default.html', controller: 'MarrowCtrl'}).
      when('/user/:user', {template: '<div ng-include="templateUrl">Loading...</div>', controller: 'UserCtrl'});
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

marrowApp.controller('RootCtrl', function ($scope,$http,$location,$route) {
  $scope.url = "";
  $scope.title = "";
  $scope.bone.sectionTitle = "";

  $scope.update = function() {
    return $http.get(getendpoint).success(function(data) {
      $scope.bone.sectionTitle = data.sectionTitle;
      $scope.bone = data.marrow;
    });
  };

  check_login().success(
    function(is_loggedon) {
      is_loggedon = JSON.parse(is_loggedon);
      if (!is_loggedon) { $location.url('/login');}
  }).finally(function (){

    $scope.update().success(function(data) {
      $scope.bone.sectionTitle = data.sectionTitle;
      $scope.bone = data.marrow;
      if (afterGet !== undefined) {afterGet($scope,$http,$route);}
    });

    if (cb !== undefined) {cb($scope,$http,$route);}
  });
});


function controllerFactory(name, getendpoint, cb, afterGet) {
  us = null;
  marrowApp.controller(name, function ($scope,$http,$location,$route, SubscribedTo, UserService) {
    us=UserService;
    $scope.url = "";
    $scope.title = "";
    //$scope.sectionTitle = "";
    $scope.friends = SubscribedTo.get();

    $scope.update = function() {
      var config = {params: $scope.args? $scope.args: {}};
      q = config;
      return $http.get(getendpoint, config).success(function(data) {
        $scope.bone = data;
      });
    };

    check_login().success(
      function(is_loggedon) {
        is_loggedon = JSON.parse(is_loggedon);
        if (!is_loggedon) { $location.url('/login');}
    }).finally(function (){

      $scope.update().success(function(data) {
        $scope.bone = data;
        if (afterGet !== undefined) {afterGet($scope,$http,$route, null, SubscribedTo, UserService);}
      });

      if (cb !== undefined) {cb($scope,$http,$route, null, SubscribedTo, UserService);}
    });
  });
}

controllerFactory('RandomMarrowCtrl', '/api/bones/random',
  function($scope,$http, _, __, ___, UserService) {
    $scope.toggleSubscribe = toggleSubscribe($http, $scope, UserService);
  },
  function ($scope,$http, _, __, ___, UserService) {
    $scope.args = {last: $scope.bone.sectionTitle};
    $scope.iFollow = UserService.follows({user:$scope.bone.sectionTitle});
});

controllerFactory('SubscriptionCtrl', '/api/bones/subscriptions',
  function($scope, $http, Bones, SubscribedTo){
    $scope.gravURL = function(uid) {
      var hash = CryptoJS.MD5(uid);
      return '//gravatar.com/avatar/'+hash+'?d=identicon&s=24';
    };
    $scope.emptyOrEquals = function(actual, expected) {
      if (!expected) { return true;}
      else {return actual === expected;}
    };
  });

controllerFactory('MarrowCtrl', '/api/bones', function($scope,$http,$route) {
  $scope.delete = deleteLink($scope);
  $scope.postobj = {
    url: "",
    title: ""
  };
  $scope.addLink = addLink($scope);
});

function toggleSubscribe($http,$scope, UserService) {
  return function (txt) {
    console.log($scope.bone.sectionTitle);
    var postObj = {"from":$scope.bone.sectionTitle, "to":$scope.bone.sectionTitle};
    var promise = null;

    if ($scope.iFollow.follows) {
      promise = $http.post('/api/bones/unsubscribe', postObj);
    } else {
      promise = $http.post('/api/bones/subscribe', postObj);
    }

    return promise.success(function(result) {
        console.log('bing!');
        result = JSON.parse(result);
        if (result) {
          $scope.iFollow.follows = ! $scope.iFollow.follows;
        }
      });
  };
}

function unsubscribe($http,$scope) {
  return function () {
    var postObj = {"from":$scope.bone.sectionTitle};
    $http.post('/api/bones/unsubscribe', postObj);

    $scope.unsubscribeClass='is-hidden';
    $scope.subscribeClass='';
  };
}

function subscribe($http,$scope) {
  return function () {
    var postObj = {"to":$scope.bone.sectionTitle};
    $http.post('/api/bones/subscribe', postObj);

    $scope.unsubscribeClass='';
    $scope.subscribeClass='is-hidden';
  };
}

marrowApp.controller('UserSettingCtrl', function ($scope,$http,$location) {
  $scope.oldPassword = '';
  $scope.newPassword = '';
  $scope.changePassword = function() {
    var postObj = {"old_password": $scope.oldPassword, "new_password": $scope.newPassword};
    $http.post('/api/user/change-password', postObj).success(function(result) {
      if (result.status === true) {
        $location.url('/');
      } else {
        $scope.message = result.message;
      }
    });
  };
});

function addLink($scope) {
  injector = angular.injector(['ng']);
  $http = injector.get('$http');
  return function() {
    $http.post('/api/bones/add', $scope.postobj).success(function(data) {
      if (data.success) {
        $scope.postobj.url = "";
        $scope.update();
      }
    });
  };
}


marrowApp.controller('UserCtrl', function ($scope,$http,$routeParams, UserService, BoneService) {
  check_login();
  $scope.url = "";
  $scope.title = "";
  $scope.toggleSubscribe = toggleSubscribe($http, $scope);
  $scope.delete = deleteLink($scope);

  var user = $routeParams.user;
  $scope.bone = BoneService.user({user: user});

  $scope.postobj = {
    url: "",
    title: ""
  };
  $scope.addLink = addLink($scope);

  $scope.iFollow = UserService.follows({user:user},function(result) {
    $scope.templateUrl = result.me === user? "/partials/default.html": "/partials/random.html";
  });

  $scope.update = function() {
    $scope.bone = BoneService.user({user: user});
  };

});

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

