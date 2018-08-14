var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mysql = require('mysql');
var async = require("async");

// Fs to open file stream, read file and write
var fs = require('fs');

var Entities = require('html-entities').XmlEntities;
var entities = new Entities();

// =======================================
// Database
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'vantho',
  database : 'chat'
});

connection.connect();
var message_offset = 30;

//======================================
io.on('connection', function(socket) {


  // Emit with ID
  //io.sockets.sockets[socket.id].emit('respond', { hello: 'Hey, Mr.Client!' });

  socket.email = socket.request._query['email'];
  socket.friends = [];
  socket.chat_session = [];

  socket.join(socket.email);

  console.log(socket.email  + ' with id ' + socket.id + ' connected!');

  var friend_list = [];

  async.waterfall([
    function(callback) {
      connection.query("SELECT id FROM users WHERE email=?", [socket.email], function(err, result) {
        if (result.length > 0) {
          socket.user_id = result[0]['id'];
          callback();
        } else {
          callback(Error('Người dùng với email ' +socket.email+ ' không tồn tại!'));
        }
      });
    },
    function(callback) {
      connection.query("SELECT * FROM users WHERE id != ?", [socket.user_id], callback);
    }
  ], function(error, result) {
    if (error) {
      console.log(error);
      throw error;
    }
    result.forEach(function(item) {
      socket.friends.push(item['email']);
      friend_list.push({
        id: item['id'],
        name: item['name'],
        email: item['email'],
        online: !!io.nsps['/'].adapter.rooms[item['email']]
      });
      // Emit online
      if (io.nsps['/'].adapter.rooms[item['email']]) {
        io.to(item['email']).emit('friend online', {email: socket.email});
      }
    });
    socket.emit('update_friend', {list: friend_list});
  });
  socket.on('message', function (data) {
    console.log(data);
    if (!data.to || !data.message) {
      socket.emit('err', {message: "Sai định dạng gói tin!"});
      console.log ("Đã chặn gói tin không hợp lệ t '" +socket.email);
    }
    else {
      // Encode html this message to avoid syntax error and XXS
      var data_message = entities.encode(data.message);

      // Select and assign chat session id for this chat
      if (socket.chat_session[data.to]) {
        var query = "SELECT id FROM chat_sessions WHERE user1 = ? AND user2 = ? AND created_at > DATE_SUB(now(), INTERVAL 1 HOUR) ORDER BY `chat_sessions`.`created_at` DESC LIMIT 1";
        // We have two cases: No row return, one row (able to use or not)
        connection.query(query, [data.to, socket.email].sort(), function (err,  result) {
          if (err) {
            throw err;
          }

          // If an recently session detected
          if (result.length === 1) {
            socket.chat_session[data.to] = result[0]['id'];

            // Call saveMessage function
            saveMessage(data_message, socket.email, socket.chat_session[data.to], function (id) {
              io.to(socket.email).emit('self message', {with: data.to, id: id, message: data_message});
              io.to(data.to).emit('message', {from: socket.email, id: id, message: data_message});
            });
          }
          else {
            // Insert another row and get insertedID
            query = "INSERT INTO `chat_sessions` (`user1`, `user2`) VALUES (?, ?);";
            connection.query(query, [data.to, socket.email].sort(), function (err, result1) {
              if (err) {
                throw err;
              }
              else {
                // Assign chat session name to insertId
                socket.chat_session[data.to] = result1.insertId;
                // Call saveMessage function
                saveMessage(data_message, socket.email, socket.chat_session[data.to], function (id) {
                  io.to(socket.email).emit('self message', {with: data.to, id: id, message: data_message});
                  io.to(data.to).emit('message', {from: socket.email, id: id, message: data_message});
                });
              }
            });
          }
        });

      }
      else {
        // Call saveMessage function
        saveMessage(data_message, socket.email, socket.chat_session[data.to], function (id) {
          io.to(socket.email).emit('self message', {with: data.to, id: id, message: data_message});
          io.to(data.to).emit('message', {from: socket.email, id: id, message: data_message});
        });
      }
    }
  });

  socket.on('load_previous_message', function (data) {

    if (!data.with || !data.last_id) {
      socket.emit('err', {message: "Sai định dạng gói tin!"});
    }
    else {
      getMessageById(data.last_id, function(error, result) {
        if (error) throw error;
        getMsgBySessionId(result[0]['created_at'], data.last_id, socket.email, data.with, function(res) {
          socket.emit('previous message', {with: data.with, messages: res});
        });
      });
    }
  });

  // Save message when an user is completely disconnected
  socket.on('disconnect', function() {
    console.log(socket.email + ' đã ngắt kết nối!');
    socket.friends.forEach(function (friend) {
      if (io.nsps['/'].adapter.rooms[friend]) {

        io.to(friend).emit('friend offline', {email: socket.email});
      }
    });
  });

  // On error event
  socket.on('error', function (error) {
    console.log(error)
  });
});

// Save an message to database
function saveMessage(message, sender, session_id, callback) {

  var query = "INSERT INTO `chat_messages` (`message`, `sender`, `session_id`) VALUES (?, ?, ?);";
  connection.query(query, [message, sender, session_id], function (error, result) {
    if (error){
      throw error;
    }
    callback(result.insertId);
  });
}

function getMessageById(messageId, callback) {
  connection.query("SELECT * FROM chat_message WHERE id = ?", [messageId], callback);
}

// Get previous message by session ID, last time, last id, members
function getMsgBySessionId(lastMessageId, lastMessageTime, member1, member2, callback) {
  var tMember = [member1, member2].sort();
  var query = "SELECT id, created_at FROM chat_sessions WHERE user1 = ? AND user2 = ? AND created_at < ? ORDER BY `chat_sessions`.`created_at` DESC LIMIT 1";
  connection.query(query, [tMember[0], tMember[1], lastMessageTime],  function (error, result) {
    if (error) {
      throw error;
    }
    else {
      if (result.length === 1) {
        getPreviousMessage(result[0]['id'], lastMessageId, function (res) {
          if (res && res.length !== 0) {
            callback(res);
          }
          else {
            getMsgBySessionId(result[0]['created_at'], lastMessageTime, member1, member2, callback);
          }
        });
      }
      else {
        callback();
      }
    }
  });
}
/*
 Get previous messages by session id, last id
 */
function getPreviousMessage(sessionId, last_id, callback) {

  var query, data2bind = [sessionId, message_offset];
  if (!last_id) {
    query = "SELECT id, message, DATE_FORMAT(chat_messages.created_at,'%Y-%m-%d %H:%i:%S') as created_at, sender FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT ?";
  }
  else {
    query = "SELECT id, message, DATE_FORMAT(chat_messages.created_at,'%Y-%m-%d %H:%i:%S') as created_at, sender FROM chat_messages WHERE id < ? AND session_id = ? ORDER BY id DESC LIMIT ?";
    data2bind.unshift(last_id);
  }
  connection.query(query, data2bind, function (error, result) {
    if (result.length > 0) {
      callback(result);
    }
    else {
      callback();
    }
  });
}

// =========================Start the server=======================
/*
 Start the server
 Listen on 0.0.0.0:3000
 we can use server.listen, it's ok
 */
console.log("Server started!");
io.listen(3000);
