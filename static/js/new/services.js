var serviceModule = angular.module('marrowApp.services', ['ngResource']);

serviceModule.factory('UserBone', ['$resource',
  function boneFactory($resource){
    console.log('hi');
    return $resource('/api/bones/u/:user', {}, {
    });
}]);


serviceModule.factory('BoneService', ['$resource',
  function boneFactory($resource){
    console.log('hi');
    return $resource('/api/bones', {}, {
      add: {'method': 'POST', 'url': '/api/bones/add'},
      user: {'method': 'GET', 'url': '/api/bones/u/:user', params: {user: '@user'}},
      random: {'method': 'GET', 'url': '/api/bones/random'},
    });
}]);

serviceModule.factory('SubscribedTo', ['$resource',
  function subscriberFactory($resource) {
    return $resource('/api/user/following', {}, {});
  }]);

serviceModule.factory('UserService', ['$resource',
  function ($resource) {
    console.log(123);
    return $resource('/user/check', {}, {
      add: {'method': 'POST', 'url': '/api/user/add'},
      login: {'method': 'POST', 'url': '/api/user/login'},
      logout: {'method': 'POST', 'url': '/api/user/logout'},
      follows: {'method': 'GET', 'url': '/api/user/follows/:user', params: {user: '@user'}},
      following: {'method': 'GET', 'url': '/api/user/following'},
      environment: {'method': 'POST', 'url': '/api/user/environment'},
      changePassword: {'method': 'POST', 'url': '/api/user/change-password'}
    });
  }]
);
