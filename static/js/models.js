$(document).ready(function() {

function Marrow(data) {
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
};

function Bone() {
  var self = this;
  self.marrow = ko.observableArray([]);
  self.newLink = ko.observable();
  self.sectionTitle = ko.observable();
  self.login = new Login(self);
  self.login.check();

  self.add_marrow = function(link) {};

  function getBone(endpoint) {return function(skip, skipagain, cb) {
    $.getJSON(endpoint, function(data) {
      if (data !== []) {
        var theMarrow = $.map(data.marrow, function(item) { return new Marrow(item) });
        self.marrow(theMarrow);
        self.sectionTitle(data.sectionTitle);
      }
      console.log(cb);
      if (cb) cb();
    });
  }};

  self.random = getBone("/api/bones/random");
  self.gohome = getBone("/api/bones");
  self.mylists = getBone("/api/bones/subscriptions");

  self.update = function(cb) {
    $.getJSON("/api/bones", function(data) {
      if (data !== []) {
        var theMarrow = $.map(data.marrow, function(item) { return new Marrow(item) });
        self.marrow(theMarrow);
        self.sectionTitle(data.sectionTitle);
      }
      if (cb) cb();
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

theBone = new Bone();
ko.applyBindings(theBone);

});
