var marrowApp = angular.module('marrowApp', ['ngRoute', 'marrowApp.services', 'marrowApp.directives', 'marrowApp.utils',
                                'marrowApp.directives.boneList', 'marrowApp.userBadge']);

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

marrowApp.config(['$locationProvider', function($locationProvider) { $locationProvider.html5Mode(true); }]);

marrowApp.controller('LoginCtrl', function ($scope,$http,$route,$location) {
  $scope.message = '';

  var check_login = function () {
    injector = angular.injector(['ng']);
    $http = injector.get('$http');
    return $http.get("/api/user/check").success(function(is_loggedon) {
      console.log(is_loggedon);
      if (is_loggedon.result === true) {
        angular.element(document.body).addClass('is-logged-on');
      }
    });
  };

  check_login().success(
    function(is_loggedon) {
      if (is_loggedon.result) { $location.url('/');}
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

marrowApp.controller('RootCtrl', function ($scope,$http,$location,$route, SubscribedTo, BoneService, UserService) {
  $scope.url = "";
  $scope.title = "";

  $scope.toggleSubscribe = function (txt) {
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

  $scope.bone = {sectionTitle: "", marrow: []};
  $scope.friends = {data: []};
  $scope.args = {last: ""};

  $scope.update = function() {
    var config = {params: $scope.args? $scope.args: {}};
    return $scope.getendpoint($scope.serviceParams, function(data) {
      $scope.bone.sectionTitle = data.sectionTitle;
      $scope.bone.marrow = data.marrow;
      $scope.args = {last: $scope.bone.sectionTitle};
      $scope.iFollow = UserService.follows({user:$scope.bone.sectionTitle});
    }).$promise.then($scope._update);
  };

  UserService.check(function(is_loggedon) {
    if (is_loggedon.result === true) {
      angular.element(document.body).addClass('is-logged-on');
    } else {
      $location.url('/login');
    }

    $scope.update();
  });

});

marrowApp.controller('RandomMarrowCtrl', function ($controller, $scope,$http,$location,$route, SubscribedTo, BoneService, UserService) {
  $scope._update = function() {};
  $scope.getendpoint = BoneService.random;
  angular.extend(this, $controller('RootCtrl', {$scope: $scope}));
});

marrowApp.controller('SubscriptionCtrl', function ($controller,$scope,$http,$location,$route, SubscribedTo, BoneService, UserService) {
  $scope.emptyOrEquals = function(actual, expected) {
    if (!expected) { return true; }
    else {return actual === expected; }
  };

  $scope._update = function() {
    var following_set = Object.create(null);
    $scope.bone.marrow.map(function(o) {
      if (!(o.poster in following_set)) {
        following_set[o.poster] = true;
        $scope.friends.data.push(o.poster);
      }
    });
  };

  $scope.getendpoint = BoneService.subscriptions;
  angular.extend(this, $controller('RootCtrl', {$scope: $scope}));
});

marrowApp.controller('MarrowCtrl', function ($controller,$scope,$http,$location,$route, SubscribedTo, BoneService, UserService) {
  $scope.postobj = {url: "", title: ""};

  $scope.delete = function (linkid) {
    $http.delete('/api/bones/link/'+linkid).success(function (deleted) {
      deleted = JSON.parse(deleted);
      if (deleted === true) { $scope.update(); }
    });
  };

  $scope.addLink = function() {
    $http.post('/api/bones/add', $scope.postobj).success(function(data) {
      if (data.success) {
        $scope.postobj.url = "";
        $scope.update();
      }
    });
  };

  if ($scope.getendpoint === undefined) {
    console.log('getendpointunset');
    $scope.getendpoint = BoneService.get;
  }
  angular.extend(this, $controller('RootCtrl', {$scope: $scope}));
});

marrowApp.controller('UserCtrl', function ($controller, $scope,$http,$routeParams, UserService, BoneService) {
  var user = $routeParams.user;
  $scope.getendpoint = BoneService.user;
  $scope.serviceParams = {user: user};

  angular.extend(this, $controller('MarrowCtrl', {$scope: $scope}));
  $scope._update = function() {
    $scope.iFollow.$promise.then(function(result) {
      console.log(result.me);
      $scope.templateUrl = result.me === user? "/partials/default.html": "/partials/random.html";
    });
  };

});

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

