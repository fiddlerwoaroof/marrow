var serviceModule = angular.module('marrowApp.services', ['ngResource']);

serviceModule.factory('UserBone', ['$resource',
  function boneFactory($resource){
    console.log('hi');
    return $resource('/api/bones/u/:user', {}, {
    });
}]);


serviceModule.factory('Bone', ['$resource',
  function boneFactory($resource){
    console.log('hi');
    return $resource('/api/bones', {}, {
      add: {'method': 'POST', 'url': '/api/bones/add'}
    });
}]);

serviceModule.factory('SubscribedTo', ['$resource',
  function subscriberFactory($resource) {
    return $resource('/api/user/following', {}, {});
  }]);
