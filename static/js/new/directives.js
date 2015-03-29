var utils = angular.module('marrowApp.directives', ['marrowApp.utils']);
var compareTo = function() { return {
  require: "ngModel",
  scope: { otherModelValue: "=compareTo" },
  link: function(scope, element, attributes, ngModel) {
    ngModel.$validators.compareTo = function(modelValue) {
      return modelValue == scope.otherModelValue;
    };
    scope.$watch("otherModelValue", function() {
      ngModel.$validate();
    });
  }
};};

utils.directive("compareTo", compareTo);
