$(document).ready(function() {

function Marrow(data) {
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
};

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

function Bone() {
  var self = this;
  self.marrow = ko.observableArray([]);
  self.newLink = ko.observable();
  self.login = new Login(self);
  self.login.check();

  self.add_marrow = function(link) {};

  self.random = function() {
    $.getJSON("/api/bones/random", function(data) {
      if (data !== []) {
        var theMarrow = $.map(data.marrow, function(item) { return new Marrow(item) });
        self.marrow(theMarrow);
      }
    });
  };

  self.update = function(cb) {
    $.getJSON("/api/bones", function(data) {
      if (data !== []) {
        var theMarrow = $.map(data.marrow, function(item) { return new Marrow(item) });
        self.marrow(theMarrow);
      }
      if (cb) cb();
    });
  };

  self.mylists = function() {
    $.getJSON("/api/bones/subscriptions", function(data) {
      if (data !== []) {
        var theMarrow = $.map(data.marrow, function(item) { return new Marrow(item) });
        self.marrow(theMarrow);
      }
      cb();
    });
  };

  self.addLink = function() {
    var newLink = {url:self.newLink(),title:''};
    $.ajax("/api/bones/submit", {
      data: ko.toJSON(newLink),
      type: "post", contentType: "application/json",
      success: function(result) {
        self.marrow.push(newLink);
        self.newLink("");
    }});
  };

};

ko.applyBindings(new Bone());

});
