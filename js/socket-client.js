/**
 * Created by VanTho on 08/07/2017.
 */

// Get and set client username
var me_name = $('#me_name').val();
var chat_data = [];

// Get name from session storage
// if (typeof sessionStorage.username === 'undefined' && sessionStorage.username.length === 0) {
//
//     $.ajax({
//         url : "php/get-name.php",
//         type : "post",
//         dataType:"text",
//         data : {
//         },
//         success : function (result) {
//             if (result === 'false') {
//                 //impossible
//             }
//             else {
//                 localStorage.username = result;
//                 me_name = result;
//             }
//         }
//     });
// }
// else {
//     me_name = sessionStorage.username;
// }

$( document ).ready(function () {

    // Create an socket
    var socket = io('ws://localhost:3000', {transports: ['websocket'], query: {'username':me_name}});

    socket.onerror = function (event) {
      console.log("error");
    };
    // ========================Socket event=============================

    // When receive an update friend event
    socket.on( 'update-friend', function (data) {

        console.log(data);

        $('#ul_friend').html("");

        data.list.forEach(function (friend, index) {

            if (friend.username !== me_name) {
                if (friend.online !== 1) {
                    $('#ul_friend').append("<li id='" +friend.username+ "' class='list-group-item'>" + friend.username + "</li>");
                }
                else {
                    $('#ul_friend').append("<li id='" +friend.username+ "' class='list-group-item online'>" + friend.username + "</li>");
                }
            }
        });

    });

    // When an user is online
    socket.on ('friend online', function (data) {

        // data.username
        console.log(data.friend_id + " is online!");
        $('#' + data.friend_id).addClass("online");

    });

    // When an user is offline
    socket.on ('friend offline', function (data) {

        // data.username
        console.log(data.friend_id + " is offline!");
        $('#' + data.friend_id).removeClass("online");
    });

    // When client connect to server (include reconnect)
    socket.on( 'connect' , function () {
        console.log("connected");
    });

    socket.on('respond', function (data) {
        console.log(data);
    });

    // Client try to connect the server 5 times after lost connection
    socket.on( 'reconnect', function () {
        //
    });

    // Message from them self
    socket.on ('self msg', function (data) {

        if (typeof chat_data[data.inn] === 'undefined') {
            chat_data[data.inn] = [];
        }
        chat_data[data.inn].push({'from': me_name, 'msg': data.msg});

        // If current chat box is open
        if ($('#friend_username').val() === data.inn) {
            add_message(me_name, data.msg);
        }
    });

    // Message previous message
    socket.on ('pre msg', function (data) {

        console.log(data);

        if (data.arr === 'null') {
            console.log("No new message was found in this conversation!");
            return;
        }

        if (typeof chat_data[data.inn] === 'undefined') {
            chat_data[data.inn] = [];
        }
        chat_data[data.inn] = data.arr;

        // If current chat box is open
        if ($('#friend_username').val() === data.inn) {
            data.arr.forEach(function (item, index) {
                add_message(item.from, item.msg);
            });
        }
    });

    // On message event
    socket.on( 'msg', function( data ) {

        // If it's user message
        if (data.from === me_name) {
            if (typeof chat_data[data.to] === 'undefined') {
                chat_data[data.to] = [];
            }
            chat_data[data.to].push({from: data.from, msg: data.msg});

            if (data.to === $('#friend_username').val()) {
                add_message(data.from, data.msg);
            }
        }
        else {
            if (typeof chat_data[data.from] === 'undefined') {
                chat_data[data.from] = [];
            }

            chat_data[data.from].push({from: data.from, msg: data.msg});

            if (data.from === $('#friend_username').val()) {
                add_message(data.from, data.msg);
            }
        }

    });

    // On error event
    socket.on( 'err', function( data ) {

        console.log("Err " +data.err_code+ ": " +data.err_detail);

    });
    // =====================================================

    // Get chat box from html
    var all_chat_html = $('#chat-box');

    function getEventTarget(e) {
        e = e || window.event;
        return e.target || e.srcElement;
    }

    // Get event click on friend list
    var ul = $('#ul_friend');
    ul.click(function (event) {

        // Current friend
        var friend = $('#friend_username');

        var new_friend_username = getEventTarget(event).innerHTML;
        if (new_friend_username === friend.val()) {
            return;
        }

        $('#friend_name').html(new_friend_username);
        friend.val(new_friend_username);
        all_chat_html.html("");

        // Load message in array from username
        if (typeof chat_data[friend_username] !== 'undefined') {

            chat_data[friend_username].forEach(function (item, index) {

                // Item is now message\
                add_message(item.from, item.msg);
            });
        }
        else {
            socket.emit('load pre msg', {inn: friend.val()});
        }

    });

    // User click send button
    $( "#send" ).click( function() {

        // Get friend ID and message
        var friend_id = $( "#friend_username" ).val();
        var message = $( "#messageInput" ).val();

        if (friend_id === '' || message === '') {
            return;
        }

        // Emit this message to server
        socket.emit( 'message', { to: friend_id, msg: message } );

        // Reset message after send
        //$('#messageInput').val("");

    });

    $('#load_pre_msg').click(function() {
       socket.emit('load-pre-msg', {inn: $('#friend_username').val()});

    });

});

function add_message(from, message) {

    var chat_message = $('#chat-box');

    var actualContent = chat_message.html();
    var newMsgContent = '';
    if (from === me_name) {
        newMsgContent = '<p class="user-msg">' + message + '</p>';
    }
    else {
        newMsgContent = '<p class="friend-msg">' + message + '</p>';
    }
    var content = actualContent + newMsgContent;

    chat_message.html( content );
}