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
    database: "mxh"
});

con.connect(function(err) {
    if (err) throw err;
    con.query("SET NAME 'UTF-8'", function () {
    });
});
// =======================================
var all_chat = [];
//==============config==================

var msg_offset = 50;

//======================================
io.on('connection', function(socket) {

    // Get username from request
    //console.log(socket.request._query['username']);

    // Emit with ID
    //io.sockets.sockets[socket.id].emit('respond', { hello: 'Hey, Mr.Client!' });

    // Emit all
    //io.emit('respond', { hello: "emit all" });

    // Emit by room name
    //io.sockets.to('roomname').emit('respond', {data: "123"});

    // When user login, join this user to an room correspondent to this username
    socket.username = socket.request._query['username'];
    socket.room_list = [];
    socket.friends = [];
    socket.join(socket.request._query['username']);

    console.log(socket.username  + ' with id ' + socket.id + ' connected!');

    // Update friend list for this client
    // Friend list to return
    var friend_list = [];

    getFriendList(socket.username, function (friend_array) {

        friend_array.forEach(function (friend_name, index, p3) {

            // Add this friend to friend list
            socket.friends.push(friend_name);

            var ii = io.sockets.adapter.rooms;

            if (typeof io.sockets.adapter.rooms[friend_name] !== 'undefined' && io.sockets.adapter.rooms[friend_name].length !== 0) {
                friend_list.push({'username': friend_name, 'online': 1});

                // Emit to this friend that this friend is online
                io.sockets.to(friend_name).emit('friend online', {friend_id: socket.username});
            }
            else {
                friend_list.push({'username': friend_name, 'online': 0});
            }
        });
        socket.emit('update-friend', {list: friend_list});
    });


    // When an user want to send message to someone or to them self
    socket.on('message', function (data) {

        var data_msg = entities.encode(data.msg);

        //data.from, data_msg
        var chat_name;

        // Send all msg to two channel
        io.sockets.to(socket.username).emit('self msg', {msg: data_msg, inn: data.to});

        // If this target user is exist in friend message
        if (socket.friends.indexOf(data.to) !== -1) {
            io.sockets.to(data.to).emit('msg', {from: socket.username, msg: data_msg});
        }
        else {
            socket.emit('err', {err_code: 123, err_detail: "The username requested does not match!"});
            log ("User '" +socket.username + "' send '" + data_msg + "' to '" + data.to + "' but this friend not found!" );
        }

        // Add to all_chat
        // Create array with two client name
        chat_name = [socket.username, data.to].sort()[0] + '_' + [socket.username, data.to].sort()[1];

        if (typeof all_chat[chat_name] === 'undefined') {
            all_chat[chat_name] = [];
        }
        all_chat[chat_name].push({'from': socket.username, 'msg': data_msg});

        // Push this conversation name to list room
        if (socket.room_list.indexOf(chat_name) === -1) {
            socket.room_list.push(chat_name);
        }


    });

    // Load previous message
    socket.on('load pre msg', function (data) {

        // data.inn -> friend, data.offset
        var chat_name = [data.inn, socket.username].sort()[0] + '_' + [data.inn, socket.username].sort()[1];



        if (typeof all_chat[chat_name] === 'undefined') {

            // Get previous message in database
            var query = "SELECT msg FROM `chat` WHERE name='" +chat_name+ "'";

            con.query(query, function (err, row, field) {

                if (err) return;

                var num = row.length;
                if (num === 0 || row[0]['msg'] === '') {
                    socket.emit('pre msg', {inn: data.inn, arr: 'null'});
                }
                else {

                    var JSON_array = row[0]['msg'].split('][').join(',');

                    // Decode result to array
                    var arr = (JSON.parse(JSON_array)).map(function (item) {
                        return {from: item.from, msg: item.msg};
                    });

                    if (arr.length <= 30) {
                        socket.emit('pre msg', {inn: data.inn, arr: arr});
                    }
                    else {
                        socket.emit('pre msg', {inn: data.inn, arr: arr.splice(arr.length -30, arr.length + 1)});
                    }
                }
            });

        }
        else {
            var max = all_chat[chat_name];
            if (max <= 50) {
                socket.emit('pre msg', {inn: data.inn, arr: all_chat[chat_name]});
            }
            else {
                socket.emit('pre msg', {inn: data.inn, arr: all_chat[chat_name].splice(max - msg_offset, max + 1)});
            }
        }


    });

    socket.on('disconnect', function() {
        console.log(socket.username + ' with id ' + socket.id + ' disconnected!');

        // Send emit to all friend
        socket.friends.forEach(function (p1, p2, p3) {
            if (typeof io.sockets.adapter.rooms[p1] !== 'undefined' && io.sockets.adapter.rooms[p1].length !== 0) {

                // Emit to this friend that this friend is online
                io.sockets.to(p1).emit('friend offline', {friend_id: socket.username});
            }
        });

        saveMessage(socket.room_list, socket.username);
    });

    socket.on('error', function () {
        saveMessage(socket.room_list, socket.username);
    });
});

// Handle exception, prevent from shutdown
process.on('uncaughtException', function (err) {
    log('Caught exception: ' + err);
});

// Start the server
console.log("Server started!");
io.listen(3000);
//server.listen(3000);

// Enter an username and return all friends's username
function getFriendList(username, callback) {

    var arr = [];

    var query = "SELECT user1, user2 FROM `relationship` WHERE (user1='" +username+ "' OR user2='" +username+ "') AND status = '1';";

    con.query(query, function (err, row, field) {

        var num = row.length;

        for (var i = 0 ; i < num ; i++) {

            (row[i].user1) === username ? arr.push(row[i].user2) : arr.push(row[i].user1);
        }
        callback(arr);
    });

}

// Save all message relate to this username
function saveMessage(list, username) {

    // get current time to exceed
    var dt = dateTime.create();

    // Only save message if client is completely disconnected
    if (typeof io.sockets.adapter.rooms[username] === 'undefined' || io.sockets.adapter.rooms[username].length === 0) {

        // We have an list of room
        list.forEach(function (room_name) {

            // Assign to an temp array
            var temp_chat_array = JSON.stringify(all_chat[room_name]);

            // Delete this chat room, then write to dtb
            delete all_chat[room_name];

            var chat_name = room_name + dt.format('_m-Y');

            // Insert into database
            var query = "INSERT INTO `chat` (`name`, `msg`) VALUES ('" +chat_name+ "', '" + temp_chat_array + "') ON DUPLICATE KEY UPDATE msg = concat(ifnull(msg,''), '" + temp_chat_array +"')";
            con.query(query, function () {

                log("Updated chat with name: " + chat_name);
            });

        });
    }
}

// Receive log message and save to log file with time.
function log(text) {
    var dt = dateTime.create();
    var today = dt.format('Y-m-d_');
    var time_now = dt.format('H:M:S');
    fs.appendFile('log/' + today + 'log.txt', time_now + ': ' +  text + '\r\n');
}

function Login(username, callback) {
    var query = "Select ";
    con.query(query, function (err, row, field) {


    });
}