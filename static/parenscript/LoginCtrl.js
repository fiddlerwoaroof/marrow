var test = angular.module(test, ngroute());
test.controller('LoginCtrl', function ($scope) {
    $scope.tab = 'login';
    $scope.message = '';
    function check_login() {
        var injector26 = angular.injector('ng'());
        var $http = injector26.get('$http');
        return $http.get('/api/user/check')(null).success(function (is_loggedon) {
            return is_loggedon.result === true ? angular.element(document.body).addclass('is-logged-on') : null;
        });
    };
    check_login().success(function (is_loggedon) {
        return is_loggedon.result ? $location.url('/') : null;
    });
    $scope.newuser = function () {
        var username27 = $scope.username;
        var password28 = $scope.password;
        var postobj = { 'username' : username27, 'password' : password28 };
        return $http.post('/api/user/add')(postobj).success(function (is_l) {
            return is_l.result === true ? $location.url('/') : ($scope.message = added_user.message);
        });
    };
    return $scope.login = function () {
        var username29 = $scope.username;
        var password30 = $scope.password;
        return $http.post('/api/user/login')({ 'username' : username29, 'password' : password30 }).success(function (login_succeeded) {
            var el = angular.element(document.queryselector('#login_form'));
            return login_succeeded.status === true ? $location.url('/') : ($scope.message = login_succeeded.message)();
        });
    };
});
