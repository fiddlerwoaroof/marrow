angular.module('marrowApp.directives', [])

.directive('gravatarImg', function() {
  return {
    template: function (elem, attr) {
      console.log(attr.username);
      var hash = CryptoJS.MD5(attr.username);
      console.log(attr);
      var userPage = '/user/'+attr.username;
      var url = '//gravatar.com/avatar/'+hash+'?d=identicon&s=48';
      return '<a href="'+userPage+'"><img src="'+url+'" /></a>';
    }
  };
});


