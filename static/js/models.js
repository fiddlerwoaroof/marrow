$(document).ready(function() {

function Marrow(data) {
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
};

function Bone() {
  var self = this;
  self.marrow = ko.observableArray([]);
  self.newLink = ko.observable();

  self.add_marrow = function(link) {};

  $.getJSON("/api/data", function(data) {
    var otherMarrow = $.map(data.marrow, function(item) { return new Marrow(item) });
    self.marrow(otherMarrow);
  });

  self.addLink = function() {
    var newLink = {url:self.newLink(),title:''};
    $.ajax("/api/data/submit", {
      data: ko.toJSON(newLink),
      type: "post", contentType: "application/json",
      success: function(result) {
        self.marrow.push(newLink);
        self.newLink("");
    }});
  }
};

ko.applyBindings(new Bone());

});
