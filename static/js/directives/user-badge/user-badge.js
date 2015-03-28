angular.module('marrowApp.directives', ['marrowApp.utils'])

.directive('gravatarImage', function() {
  return {
    scope: { userName: '@', class: '@' },
    controller: function($scope) {
      var hash = CryptoJS.MD5($scope.userName);
      $scope.gravUrl = '//gravatar.com/avatar/'+hash+'?d=identicon&s=24';
    },
    template: '<img class="{{class}}" src="{{gravUrl}}" title="{{userName}}" />'
  };
})

.directive('userBadge', function() {
  return {
    scope: {
      poster: '@',
    },
    templateUrl: '/js/directives/user-badge/user-badge.html',
    controller: function($scope) {
      $scope.gravURL = function(uid) {
        var hash = CryptoJS.MD5(uid);
        return '//gravatar.com/avatar/'+hash+'?d=identicon&s=24';
      };
    }
  };
});

