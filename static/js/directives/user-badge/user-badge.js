angular.module('marrowApp.directives.userBadge', ['marrowApp.utils'])

.directive('gravatarImage', function() {
  return {
    scope: { userName: '@', class: '@'},
    controller: function($scope) {
      $scope.gravUrl = function() {
        var hash = CryptoJS.MD5($scope.userName);
        return '//gravatar.com/avatar/'+hash+'?d=identicon&s=24';
      };
    },
    template: '<img class="identicon {{class}}" src="{{gravUrl()}}" title="{{userName}}" />'
  };
})

.directive('userBadge', function() {
  return {
    scope: {
      poster: '@',
      noImage: '@'
    },
    templateUrl: '/js/directives/user-badge/user-badge.html',
    controller: function($scope,$attrs) {
      $scope.withoutImage = $attrs.hasOwnProperty('noImage');
      $scope.gravURL = function(uid) {
        var hash = CryptoJS.MD5(uid);
        return '//gravatar.com/avatar/'+hash+'?d=identicon&s=24';
      };
    }
  };
});

