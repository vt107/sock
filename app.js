var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mysql = require('mysql');

// get time from system
var dateTime = require('node-datetime');

// Fs to open file stream, read file and write
var fs = require('fs');

// We have to use html entry encode to defend our system
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

// =======================================
// Database
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "socket"
});

con.connect(function(err) {
    if (err) throw err;
    con.query("SET NAME 'UTF-8'", function () {
    });
});

//==============config==================

var message_offset = 30;

//======================================
var user = io.of('/user');
user.on('connection', function(socket) {

    // Get username from request
    //console.log(socket.request._query['username']);

    // Emit with ID
    //io.sockets.sockets[socket.id].emit('respond', { hello: 'Hey, Mr.Client!' });

    // Emit all
    //io.emit('respond', { hello: "emit all" });

    // Emit by room name
    //io.sockets.to('room_name').emit('respond', {data: "123"});

    // Check username, if not found, close socket
    if (typeof socket.request._query['username'] === 'undefined') {
        socket.end();
        log("Force close an socket without username.");
        return;
    }

    // When user login, join this user to an room correspondent to this username
    socket.username = socket.request._query['username'];
    socket.friends = [];
    socket.chat_session = [];

    socket.join(socket.request._query['username']);

    console.log(socket.username  + ' with id ' + socket.id + ' connected!');

    // Update friend list for this client
    // Friend list to return
    var friend_list = [];

    getFriendList(socket.username, function (friend_array) {

        friend_array.forEach(function (friend_name) {

            // Add this friend to friend list
            socket.friends.push(friend_name.username);

            if (typeof user.adapter.rooms[friend_name.username] !== 'undefined' && user.adapter.rooms[friend_name.username].length !== 0) {
                friend_list.push({username: friend_name.username, name: friend_name.name, 'online': 1});

                // Emit to this friend that this friend is online
                user.to(friend_name.username).emit('friend online', {friend_id: socket.username});
            }
            else {
                friend_list.push({username: friend_name.username, name: friend_name.name, 'online': 0});
            }
        });
        socket.emit('update-friend', {list: friend_list});
    });


    // When an user want to send message to someone or to them self
    socket.on('message', function (data) {

        if (typeof data.to === 'undefined' || typeof data.message === 'undefined' || typeof data.time === 'undefined') {

            socket.emit('err', {err_code: 124, err_detail: "Invalid message packet structure!"});
            log ("Deny an invalid packet from '" +socket.username, '98');
        }
        else {

            var data_message = entities.encode(data.message);
            //data.from, data_message, data.time

            // Send message to it self
            user.to(socket.username).emit('self message', {message: data_message, inn: data.to, time: data.time});

            // If this target user is exist in friend message
            if (socket.friends.indexOf(data.to) !== -1) {
                user.to(data.to).emit('message', {from: socket.username, message: data_message, time: data.time});
            }
            else {
                socket.emit('err', {err_code: 123, err_detail: "The username requested does not match!"});
                log ("User '" +socket.username + "' send '" + data_message + "' to '" + data.to + "' but this friend not found!" );
                return;
            }

            // Select and assign chat session id for this chat
            if (typeof socket.chat_session[data.to] === 'undefined') {

                //SELECT `id`, `user1`, `user2`, `created_time` FROM `chat_sessions` WHERE created_time < DATE_SUB(now(), INTERVAL 3 HOUR);
                //var query = "SELECT id FROM chat_sessions WHERE ((user1 = '" + socket.username + "' AND user2 = '" + data.to + "') OR (user1 = '" + data.to + "' AND user2 = '" + socket.username + "') AND created_time < DATE_SUB(now(), INTERVAL 3 HOUR) LIMIT 1;";
                var query = "SELECT id FROM chat_sessions WHERE user1 = '" + [data.to, socket.username].sort()[0] + "' AND user2 = '" + [data.to, socket.username].sort()[1] + "' AND created_time > DATE_SUB(now(), INTERVAL 1 HOUR) ORDER BY `chat_sessions`.`created_time` DESC LIMIT 1;";

                // We have two cases: No row return, one row (able to use or not)
                con.query(query, function (err, result) {
                    if (err) {
                        //log(err, 129);
                        throw err;
                    }

                    // If an recently session detected
                    if (result.length === 1) {
                        socket.chat_session[data.to] = result[0]['id'];

                        // Call saveMessage function
                        saveMessage(data_message, data.time, socket.username, socket.chat_session[data.to]);
                    }
                    else {

                        // Get current time from system
                        var dt = dateTime.create();

                        // Insert another row and get insertedID
                        query = "INSERT INTO `chat_sessions` (`id`, `user1`, `user2`, `created_time`) VALUES (NULL, '" + [data.to, socket.username].sort()[0] + "', '" + [data.to, socket.username].sort()[1] + "', '" + dt.format('Y-m-d H:M:S') + "');";
                        con.query(query, function (err, result) {

                            if (err) {
                                //log (err);
                                throw err;
                            }
                            else {
                                // Assign chat session name to insertId
                                socket.chat_session[data.to] = result.insertId;

                                // Call saveMessage function
                                saveMessage(data_message, data.time, socket.username, socket.chat_session[data.to]);
                            }
                        });
                    }

                });

            }
            else {

                // Call saveMessage function
                saveMessage(data_message, data.time, socket.username, socket.chat_session[data.to]);
            }
        }
    });

    // Load previous message
    socket.on('load pre message', function (data) {

        if (typeof data.inn === 'undefined' || typeof data.last_id === 'undefined' || data.last_time === 'undefined') {
            socket.emit('err', {err_code: 125, err_detail: "Invalid load message packet structure!"});
        }
        else {

            //function getMsgBySessionId(month, year, last_id, member1, member2, callback) {
            getMsgBySessionId(data.last_time, data.last_id, socket.username, data.inn, function(res) {

                // Handle message
                socket.emit('pre message', {inn: data.inn, arr: res});
            });
        }
    });


    // Save message when an user is completely disconnected
    socket.on('disconnect', function() {
        console.log(socket.username + ' with id ' + socket.id + ' disconnected!');
        
        socket.friends.forEach(function (friend) {
            if (typeof user.adapter.rooms[friend] !== 'undefined' && user.adapter.rooms[friend].length !== 0) {
                
                user.to(friend).emit('friend offline', {friend_id: socket.username});
            } 
        });
    });

    // On error event
    socket.on('error', function () {
        saveMessage(socket.room_list, socket.username);
    });
});

// Handle exception, prevent from shutdown
// process.on('uncaughtException', function (err) {
//     log('Caught exception: ' + err);
//     console.log("Exception detected, see log files to get more info...");
// });
//==================================================Admin namespace===============================
// var admin = io.of('/admin');
// admin.on('connection', function(socket){
//        console.log('an client connected');
// });


// Start the server
console.log("Server started!");
io.listen(3000);
//server.listen(3000);

// Enter an username and return all friends's username
function getFriendList(username, callback) {

    var arr = [];

    var query = "call get_user_friend ('" + username + "')";
    //var query = "SELECT * FROM user";

    con.query(query, function (err, row) {

        var data = row[0];

        var num = data.length;

        for (var i = 0 ; i < num ; i++) {

            (data[i].username) === username ? arr.push({username: data[i].username, name: data[i].name}) : arr.push({username: data[i].username, name: data[i].name});
        }
        callback(arr);
    });

}

// Receive log message and save to log file with time.
function log(text, line) {
    var dt = dateTime.create();
    var today = dt.format('Y-m-d_');
    var time_now = dt.format('H:M:S');
    fs.appendFile('log/' + today + 'log.txt', time_now + '- ' + line+ ": " +  text + '\r\n');
}

// Save an message to database
function saveMessage(message, time, sender, session_id) {

    var query = "INSERT INTO `chat_messages` (`id`, `message`, `created_time`, `sender`, `session_id`) VALUES (NULL, '" + message + "', '" + time + "', '" + sender + "', '" + session_id + "');";
    con.query(query, function (err, result) {
        if (err){
            //log (err, '254');
            throw err;
        }
        // Handle result and error
    });

}

// Get previous message
function getMsgBySessionId(last_time, last_id, member1, member2, callback) {

    var query = "SELECT id, created_time FROM chat_sessions WHERE user1 = '" + [member1, member2].sort()[0] + "' AND user2 = '" + [member1, member2].sort()[1] + "' AND created_time < '" + last_time + "' ORDER BY `chat_sessions`.`created_time` DESC LIMIT 1;";
    con.query(query, function (err, result) {

        if (err) {
            //log(error, '267');s
            throw err;
        }
        else {
            if (result.length === 1) {

                getPreviousMessage(result[0]['id'], last_id, function (res) {
                   if (res.length !== 0) {

                       // Got some message from database
                       callback(res);
                   }
                   else {
                           getMsgBySessionId(last_time, last_id, member1, member2, callback);
                   }

                });
            }
            else {
                callback('end');
            }
        }
    });

}

function getPreviousMessage(session_id, last_id, callback) {

    var query;
    if (last_id === 'null') {
        query = "SELECT id, message, DATE_FORMAT(chat_messages.created_time,'%Y-%m-%d %H:%i:%S') as created_time, sender FROM chat_messages WHERE session_id = '" + session_id + "' ORDER BY id DESC LIMIT " + message_offset;

    }
    else {
        query = "SELECT id, message, DATE_FORMAT(chat_messages.created_time,'%Y-%m-%d %H:%i:%S') as created_time, sender FROM chat_messages WHERE id < '" + last_id + "' AND session_id = '" + session_id + "' ORDER BY id DESC LIMIT " + message_offset;
    }
    con.query(query, function (error, result) {

        if (result.length !== 0) {
            // If some result return
            callback(result);
        }
        else {
            callback('');
        }
    });
}
