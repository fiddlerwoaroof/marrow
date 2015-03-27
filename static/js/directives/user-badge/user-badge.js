angular.module('marrowApp.directives', ['marrowApp.utils'])

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

