var serviceModule = angular.module('marrowApp.services', ['ngResource']);

serviceModule.factory('UserBone', ['$resource',
  function boneFactory($resource){
    console.log('hi');
    return $resource('/api/bones/u/:user', {}, {
    });
}]);


serviceModule.factory('BoneService', ['$resource',
  function boneFactory($resource){
    return $resource('/api/bones', {}, {
      add: {'method': 'POST', 'url': '/api/bones/add'},
      vote_up: {'method': 'POST', 'url': '/api/bones/vote/up'},
      vote_zero: {'method': 'POST', 'url': '/api/bones/vote/zero'},
      vote_down: {'method': 'POST', 'url': '/api/bones/vote/down'},
      user: {'method': 'GET', 'url': '/api/bones/u/:user', params: {user: '@user'}},
      random: {'method': 'GET', 'url': '/api/bones/random'},
      subscriptions: {'method': 'GET', 'url': '/api/bones/subscriptions/:before', 'paramDefaults': {'before': null}, 'params': {before: '@before'}},
    });
}]);

serviceModule.factory('SubscribedTo', ['$resource',
  function subscriberFactory($resource) {
    return $resource('/api/user/following', {}, {});
  }]);

serviceModule.factory('UserService', ['$resource',
  function ($resource) {
    return $resource('/user/check', {}, {
      add: {'method': 'POST', 'url': '/api/user/add'},
      check: {'method': 'GET', 'url': '/api/user/check', responseType: 'json'},
      login: {'method': 'POST', 'url': '/api/user/login'},
      logout: {'method': 'POST', 'url': '/api/user/logout'},
      follows: {'method': 'GET', 'url': '/api/user/follows/:user', params: {user: '@user'}},
      following: {'method': 'GET', 'url': '/api/user/following'},
      environment: {'method': 'POST', 'url': '/api/user/environment'},
      reputation: {'method': 'POST', 'url': '/api/user/reputation/:user', params: {user: '@user'}},
      reputations: {'method': 'POST', 'url': '/api/user/reputation'},
      changePassword: {'method': 'POST', 'url': '/api/user/change-password'},
      active: {'method': 'GET', 'url': '/api/user/active'}
    });
  }]
);
