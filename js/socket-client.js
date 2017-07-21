/**
 * Created by VanTho on 08/07/2017.
 */
var me_name = $('#me_name').val();
var chat_data = [];

// Get time when the page is load...
var begin_time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();


$(document).keypress(function(e) {
    if(e.which === 13) {
        $( "#send" ).trigger( "click" );
    }
});


$( document ).ready(function () {

    // Create an socket
    var socket = io('ws://127.0.0.1:3000/user', {transports: ['websocket'], query: {'username':me_name}});
    //var socket = io('ws://192.168.1.98:3000/user');
    socket.onerror = function () {
      console.log("error");
    };
    // ========================Socket event=============================

    // When receive an update friend event
    socket.on( 'update friend', function (data) {
        console.log(data);

        $('#ul_friend').html("");

        data.list.forEach(function (friend) {

            if (friend.username !== me_name) {
                if (friend.online !== 1) {
                    $('#ul_friend').append("<li data-username='" +friend.username+ "' data-name='" + friend.name + "' class='list-group-item'>" + friend.username + " - " + friend.name + "</li>");
                }
                else {
                    $('#ul_friend').append("<li data-username='" +friend.username+ "' data-name='" + friend.name + "'  class='list-group-item online'>" + friend.username + " - " + friend.name + "</li>");
                }
            }
        });

    });

    // When an user is online
    socket.on ('friend online', function (data) {

        // data.username
        console.log(data.friend_id + " is online!");
        $('#ul_friend').on("li").find("[data-username='" + data.friend_id + "']").addClass('online');

    });

    // When an user is offline
    socket.on ('friend offline', function (data) {

        // data.username
        console.log(data.friend_id + " is offline!");
        $('#ul_friend').on("li").find("[data-username='" + data.friend_id + "']").removeClass('online');
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
    socket.on ('self message', function (data) {

        if (typeof chat_data[data.inn] === 'undefined') {
            chat_data[data.inn] = [];
        }
        chat_data[data.inn].push({from: me_name, message: data.message, time: data.time});

        // If current chat box is open
        if ($('#friend_username').val() === data.inn) {
            append_message(me_name, data.message, data.time);
        }
    });

    // Message previous message
    socket.on ('previous message', function (data) {

        if (data.arr === 'end') {
            console.log("No new message was found in this conversation!");
            return;
        }

        if (typeof chat_data[data.inn] === 'undefined') {
            chat_data[data.inn] = [];
        }
        chat_data[data.inn] = (data.arr).concat(data.inn);

        // If current chat box is open
        if ($('#friend_username').val() === data.inn) {
            data.arr.forEach(function (item) {

                prepend_message(item.sender, item.message, item.created_time, item.id);
            });
        }
    });

    // On message event
    socket.on( 'message', function( data ) {

        // If it's user message
        if (data.from === me_name) {
            if (typeof chat_data[data.to] === 'undefined') {
                chat_data[data.to] = [];
            }
            chat_data[data.to].push({from: data.from, message: data.message});

            if (data.to === $('#friend_username').val()) {
                append_message(data.from, data.message, data.time, data.id);
            }
        }
        else {
            if (typeof chat_data[data.from] === 'undefined') {
                chat_data[data.from] = [];
            }

            chat_data[data.from].push({from: data.from, message: data.message});

            if (data.from === $('#friend_username').val()) {
                append_message(data.from, data.message, data.time, data.id);
            }
        }

    });

    // On error event
    socket.on( 'err', function( data ) {

        console.log("Err " +data.err_code+ ": " +data.err_detail);

    });
    // =====================================================

    // Get chat box from html
    var all_chat_html = $('#chat_box');

    // Get event click on friend list
    $('#ul_friend').on('click' , 'li' , function () {

        // Get clicked friend
        var new_friend_username = $(this).attr('data-username');
        var new_friend_name = $(this).attr('data-name');

        // Get current friend
        var old_friend = $('#friend_username');

        if (new_friend_username === old_friend.val()) {
            return;
        }
        // If user clicked new friend
        $('#ul_friend').each(function() {
            $(this).find('li').each(function(){
                if ($(this).attr('data-username') === old_friend.val()) {
                    $(this).removeClass("current");
                }
                else if ($(this).attr('data-username') === new_friend_username) {
                    $(this).addClass("current");
                }
            });
        });

        $('#friend_name').html(new_friend_username + " - " + new_friend_name);
        old_friend.val(new_friend_username);
        all_chat_html.html("");

        // Load message in array from username
        // if (typeof chat_data[new_friend_username ] !== 'undefined') {
        //
        //     chat_data[new_friend_username ].forEach(function (item) {
        //
        //         // Item is now message
        //         append_message(item.from, item.message, item.time, item.id);
        //     });
        // }
        // else {
        //     loadPreviousMessage();
        // }
        loadPreviousMessage();

    });

    // User click send button
    $( "#send" ).click( function() {

        var msgInput = $('#messageInput');
        // Get friend ID and message
        var friend_id = $( "#friend_username" ).val();
        var message = msgInput.val();

        if (friend_id === '' || message === '') {
            return;
        }

        var date = new Date();
        var current_time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        // Emit this message to server
        socket.emit( 'message', { to: friend_id, message: message, time: current_time } );

        // Reset message after send
        msgInput.val("");
        console.log("Sending....");

    });

    // If user scroll chat-box to top
    all_chat_html.scroll(function(){
        if($(this).scrollTop() === 0){
            loadPreviousMessage();
        }
    });

    $('#load_previous_message').click(function () {
       loadPreviousMessage();
    });

    // Load previous message when requested
    function loadPreviousMessage() {
        var first_message = $('#chat_box > p:first-child');
        var friend_username = $('#friend_username');

        var last_id = first_message.attr('data-id');
        var last_time = first_message.attr('title');

        if (typeof last_time === 'undefined') {
                last_time = begin_time;
                last_id = 'null';
        }

        socket.emit('load previous message', {inn: friend_username.val(), last_id: last_id, last_time: last_time});

        console.log("Asking message with " + friend_username.val(), last_id, last_time);
    }

});

function append_message(from, message, time, id) {

    // time format: day_hour-minute-second

    var chat_message = $('#chat_box');

    if (from === me_name) {
        chat_message.append('<p class="user-message" title="' +time+ '" data-id="' +id+ '">' +message+ '</p>');
    }
    else {
        chat_message.append('<p class="friend-message" title="' +time+ '" data-id="' +id+ '">' +message+ '</p>');
    }

    var chat_box = document.getElementById("chat_box");
    chat_box.scrollTop = chat_box.scrollHeight;

}

function prepend_message(from, message, time, id) {

    // time format: day_hour-minute-second

    var chat_message = $('#chat_box');

    if (from === me_name) {
        chat_message.prepend('<p class="user-message" title="' +time+ '" data-id="' + id + '">' +message+ '</p>');
    }
    else {
        chat_message.prepend('<p class="friend-message" title="' +time+ '" data-id="' + id + '">' +message+'</p>');
    }

    var chat_box = document.getElementById("chat_box");
    //chat_box.scrollTop = chat_box.scrollHeight;

}
