'use strickt';

var http = require('http');
var path = require("path");

var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
router.get('/:id', function(req, res, next) {
  res.sendFile(__dirname + '/client/index.html');
});

/*
Flujos

Nueva sesión
on('new') -> emit('token') -> on('deals') x2 -> emit('state') [waiting other person, joined]

Unirse a sesión
on('join') -> emit('state') [joined, 404]

Game
( on('choice') -> emit('state') [day, game over] ) x 7

Finish
emit('results') -> on('replay')

*/

var sessions = {};

var genToken = function() {
  var min = 0x1000;
  var max = 0xffff;
  var random = Math.floor(Math.random()*(max - min) + min);
  return random.toString(16);
}

io.on('connection', function(socket) {
  console.log('connection');
  var newGame = function() {
    var token = genToken();
    while(sessions[token]) {
      token = genToken();
    }
    socket.token = token;
    sessions[token] = {
      host: socket,
      victim: undefined,
      status: 'initialized',
      deals: {
        host: undefined,
        victim: undefined
      },
      choices: {
        host: [], victim: []
      }
    };
    socket.session = sessions[token];
    socket.emit('token', token);
    setTimeout(function() {
      delete sessions[token];
    }, 1000*60*15);
  };
  socket.on('new', newGame);
  socket.on('deal', function(deal) {
      var session = socket.session;
      if (!session) {
        return;
      }
      if (session.status == 'initialized' && session.host == socket) {
        session.deals.host = deal;
        session.status = 'waiting';
        socket.emit('status', 'token');
        return;
      }
      if (session.status == 'deal' && session.victim == socket) {
        if (session.deals.host == deal) {
          socket.emit('message', 'This deal is already selected');
          socket.emit('status', 'deal');
          return;
        }
        session.deals.victim = deal;
        session.status = 'start';
        session.host.emit('status', session.status);
        socket.emit('status', session.status);
        socket.emit('rewards', [session.deals.host, session.deals.victim]);
        session.host.emit('rewards', [session.deals.host, session.deals.victim]);
        return;
      }
      socket.emit('message', 'Error on deal');
  });
  socket.on('join', function(token) {
    var session = sessions[token];
    if (!session) {
       return;
    }
    if (session.status == 'waiting') {
      session.status = 'deal'
      session.victim = socket;
      session.host.emit('status', 'waiting');
      socket.emit('status', session.status);
      socket.token = token;
      socket.session = session;
      delete sessions[token];
      return;
    }
    socket.emit('status', '404');
    newGame();
  });
  socket.on('choice', function(choice) {
    var session = socket.session;
    if (!session) {
      return;
    }
    if (session.status != 'start') {
      return;
    }
    var role = 'host';
    var _role = 'victim';
    var me = session.choices.host;
    var other = session.choices.victim;
    if (session.host != socket) {
      role = 'victim'; _role = 'host';
      me = session.choices.victim;
      other = session.choices.host;
    }

    if ((me.length - other.length) > 0) {
      socket.emit('message', 'You need to wait the other player.');
      return;
    }
    if (me.length >= 7) {
      return;
    }
    me.push(choice);
    if (me.length == other.length && me.length == 7) {
      var results = [0, 0];
      for(var i = 0; i < 7; i++) {
        if (session.choices.host[i] == session.choices.victim[i]) {
          results[0]++;
          continue;
        }
        results[1]++;
      }
      session.host.emit('results', results);
      session.victim.emit('results', results);
      return;
    }

    session[_role].emit('day', other.length);
  });

  socket.on('replay', function() {
      var session = socket.session;
      if (!session) {
        return;
      }
      if (session.host != socket) {
        return;
      }
      session.choices = {host: [], victim:[]};
      session.status = 'start';
      session.host.emit(session.status);
      session.victim.emit(session.status);
  });
  socket.on('disconnect', function() {
  });
});

server.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
