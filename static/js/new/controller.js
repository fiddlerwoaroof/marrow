var marrowApp = angular.module('marrowApp', ['ngRoute', 'marrowApp.services', 'marrowApp.directives', 'marrowApp.utils',
                                             'marrowApp.directives.boneList', 'marrowApp.directives.userBadge',
                                             'angulartics', 'angulartics.google.analytics', 'angulartics.piwik']);

marrowApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/random', {templateUrl: 'partials/random.html', controller: 'RandomMarrowCtrl'}).
      when('/settings', {templateUrl: 'partials/user-settings.html', controller: 'UserSettingCtrl'}).
      when('/subscriptions', {templateUrl: 'partials/subscription.html', controller: 'SubscriptionCtrl'}).
      when('/', {templateUrl: 'partials/default.html', controller: 'MarrowCtrl'}).
      when('/user/:user', {template: '<div ng-include="templateUrl">Loading...</div>', controller: 'UserCtrl'});
  }
]);

marrowApp.config(['$locationProvider', function($locationProvider) { $locationProvider.html5Mode(true); }]);

marrowApp.controller('LoginCtrl', function ($scope,$http,$route,$location) {
  $scope.tab = 'login';

  $scope.message = '';

  var check_login = function () {
    var injector = angular.injector(['ng']);
    var $http = injector.get('$http');
    return $http.get("/api/user/check").success(function(is_loggedon) {
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
    var postObj = {"from":$scope.bone.sectionTitle, "to":$scope.bone.sectionTitle};
    var promise = null;

    if ($scope.iFollow.follows) {
      promise = $http.post('/api/bones/unsubscribe', postObj);
    } else {
      promise = $http.post('/api/bones/subscribe', postObj);
    }

    return promise.success(function(result) {
      result = JSON.parse(result);
      if (result) {
        $scope.iFollow.follows = ! $scope.iFollow.follows;
      }
    });
  };

  $scope.bone = {sectionTitle: "", marrow: []};
  $scope.friends = {data: []};

  $scope.update = function() {
    var config = {params: $scope.args? $scope.args: {}};
    return $scope.getendpoint($scope.serviceParams, function(data) {
      $scope.bone.sectionTitle = data.sectionTitle;
      $scope.bone.marrow = data.marrow;
      $scope.iFollow = UserService.follows({user:$scope.bone.sectionTitle});
    }).$promise.then($scope._update);
  };

  UserService.check(function(is_loggedon) {
    if (is_loggedon.result === true) {
      angular.element(document.body).addClass('is-logged-on');
    } else {
      $window.location.href = '/login.html';
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
  $scope.uncheckOthers = function (list) {
    for (var n in list) {
      if (n !== 'all' && list[n] === true) { list[n] = false; }
    }
  };

  $scope.friend = Object.create(null);
  $scope.friend.all = true;

  $scope.upVote = function(boneItem) {
    var apiCall = boneItem.myVote === 0? BoneService.vote_up: BoneService.vote_zero;
    apiCall({url: boneItem.url}).$promise.then(function(r) {
      if (r.success) {
        boneItem.votes = r.votes;
        boneItem.myVote = r.myVote;
      }
    }).then($scope._update);
  };

  $scope.backAPage = function() {
    var bone = $scope.bone.marrow;
    var lastitem = bone[bone.length-1].posted;
    BoneService.subscriptions({before: lastitem}).$promise.then(function(r) {
      while (r.marrow.length) {
        $scope.bone.marrow.push(r.marrow.shift());
      }
    }).then($scope._update);
  };

  $scope.emptyOrEquals = function(actual, expected) {
    var result = false;
    if (!expected) { result = true; }
    else if (expected.all) { result = true; }
    else {result = expected[actual]; }
    return result;
  };

  $scope.getBucket = function(date, buckets, classes) {
    date = Date.parse(date);
    var result = buckets.filter(function(x) {
      return x >= date;
    });
    return classes[result[result.length-1]];
  };

  $scope.following_set = Object.create(null);
  $scope._update = function() {
    var marrow = $scope.bone.marrow;
    var first = marrow[0].posted, last = marrow[marrow.length-1].posted;
    first = Date.parse(first);
    last = Date.parse(last);
    var range = first - last;
    console.log(range);
    var bucketWidth = Math.ceil(range/20);
    var buckets = [];
    var bucketClasses= {};
    for (var x = first; x > last; x -= bucketWidth) {
      buckets.push(x);
    }
    for (var x = 0; x < 20; x++) { // jshint ignore:line
      var bucket = x;
      bucketClasses[buckets[bucket]] = 'bucket-'+bucket;
    }
    $scope.bone.marrow.map(function(o) {
      o.colorClass = $scope.getBucket(o.posted, buckets, bucketClasses);
      if (!(o.poster in $scope.following_set)) {
        $scope.following_set[o.poster] = true;
        $scope.friends.data.push(o.poster);
      }
    });
    $scope.friends.reps = UserService.reputations($scope.friends.data);
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

marrowApp.controller('SidebarCtrl', function ($scope,$http,$location,$route, $window) {
  $scope.subscriptions = function() {
    if ($location.url() !== '/subscriptions') { $location.url('/subscriptions'); }
    else { $route.reload(); }
  };

  $scope.random = function() {
    if ($location.url() !== '/random') { $location.url('/random'); }
    else { $route.reload(); }
  };

  $scope.logout = function() {
    $http.get('/api/user/logout').success(function() {
      $window.location.href = '/login.html';
    });
  };
});

