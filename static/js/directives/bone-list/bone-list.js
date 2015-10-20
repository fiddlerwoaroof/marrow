boneMod = angular.module('marrowApp.directives.boneList', []);

boneMod.directive('boneList', function () {
  return {
    scope: { bone: '=', reshare: '&' },
    templateUrl: 'js/directives/bone-list/bone-list.html'
  };
});
