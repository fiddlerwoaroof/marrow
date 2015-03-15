function Login(master) {
  var self = this;
  self.username = ko.observable();
  self.password = ko.observable();

  self.check = function() {
    $.getJSON("/api/user/check", function (logged_in) {
      if (logged_in) {
        master.update(function() {
          $('#login_form').addClass('hidden');
        });
      }
    });
  };

  self.login = function() {
    var username = self.username();
    var password = self.password();
    $.ajax("/api/user/login", {
      data: ko.toJSON({username:username,password:password}),
      type: "post", contentType: "application/json",
      success: function(login_succeeded) {
        login_succeeded = JSON.parse(login_succeeded);
        console.log(login_succeeded);
        var login_form = $('#login_form');
        if (login_succeeded === true) {
          master.update(function() {
            login_form.addClass('hidden');
          });
        } else {
          login_form.children('.message').text('Login Failed!').addClass('err');
        }
          
      }
    });
  };

  self.newuser = function() {
    var username = self.username();
    var password = self.password();
    $.ajax("/api/user/add", {
      data: ko.toJSON({username:username,password:password}),
      type: "post", contentType: "application/json",
      success: function(creation_succeeded) {
        creation_succeeded = JSON.parse(creation_succeeded);
        console.log(creation_succeeded);
        if (creation_succeeded === true) {
          $('#login_form').addClass('hidden');
        }
      }
    });
  };
};
