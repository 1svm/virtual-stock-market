;(function(global) {
  'use strict';

  var view = {
    init: function() {
      var _this = this;
      _this.form = document.querySelector('form');
      _this.form.$fields = {};
      for(var prop in _this.form.elements) {
        if(_this.form.hasOwnProperty(prop)) {
          if(isNaN(parseInt(prop))) {
            _this.form.$fields[`$${prop}`] = _this.form.elements[prop];
          }
        }
      }
      _this.render();
    },
    render: function() {
      var _this = this;
      _this.form.addEventListener('submit', function(event) {
        event.preventDefault();
        for(var prop in _this.form.$fields) {
          if(_this.form.$fields.hasOwnProperty(prop)) {
            console.log(_this.form.$fields[prop].value);
          }
        }
        var xhr = new XMLHttpRequest();
        xhr.open(_this.form.method, _this.form.action);
        xhr.onload = function(res) {
          console.log(res);
        };
        xhr.send();
      });
      /*var socket = io();
       socket.on('connect', function() {
       global.socket = socket;
       console.log('Connected to Server...');
       });

       socket.on('newMessage', function(data) {
       global.document.write(JSON.stringify(data, null, 2));
       });

       socket.on('disconnect', function() {
       console.log('Disconnected from the server...');
       });*/
    }
  };

  global.addEventListener('load', view.init.bind(view));

}(window));