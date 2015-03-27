boneMod = angular.module('marrowApp.directives.boneList', []);

boneMod.directive('boneList', function () {
  return {
    scope: { bone: '=' },
    templateUrl: 'js/directives/bone-list/bone-list.html'
  };
});
