var me_email = $('#me_email').val();
var chat_data = [];
var date = new Date();

// Get time when the page is load...
var begin_time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();


$(document).keypress(function(e) {
  if(e.which === 13) {
    $( "#send" ).trigger( "click" );
  }
});


$( document ).ready(function () {

  // Create an socket
  var socket = io('ws://127.0.0.1:3000', {transports: ['websocket'], query: {'email':me_email}});
  socket.onerror = function () {
    console.log("error");
  };
  // ========================Socket event=============================

  // When receive an update friend event
  socket.on( 'update_friend', function (data) {
    console.log(data);
    $('#ul_friend').html("");
    data.list.forEach(function (friend) {
      $('#ul_friend').append("<li data-email='" +friend.email+ "' data-name='" + friend.name + "' class='list-group-item " +(friend.online? 'online': '')+ "'>" + friend.name + "</li>");
    });
  });

  // When an user is online
  socket.on ('friend online', function (data) {
    console.log(data.email + " is online!");
    $('#ul_friend').on("li").find("[data-email='" + data.email + "']").addClass('online');

  });

  // When an user is offline
  socket.on ('friend offline', function (data) {
    console.log(data.email + " is offline!");
    $('#ul_friend').on("li").find("[data-email='" + data.email + "']").removeClass('online');
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

    if (typeof chat_data[data.with] === 'undefined') {
      chat_data[data.with] = [];
    }
    chat_data[data.with].push({from: me_email, message: data.message, time: data.time});

    // If current chat box is open
    if ($('#friend_email').val() === data.with) {
      append_message(me_email, data.message, data.time);
    }
  });

  // Message previous message
  socket.on ('previous message', function (data) {
    if (data.arr === 'end') {
      console.log("No new message was found in this conversation!");
      return;
    }
    if (typeof chat_data[data.with] === 'undefined') {
      chat_data[data.with] = [];
    }
    chat_data[data.with] = (data.arr).concat(data.with);

    // If current chat box is open
    if ($('#friend_email').val() === data.with) {
      data.arr.forEach(function (item) {

        prepend_message(item.sender, item.message, item['created_at'], item.id);
      });
    }
  });

  // On message event
  socket.on('message', function( data ) {
    console.log(data);
    if (data.from === me_email) {
      if (!chat_data[data.to]) {
        chat_data[data.to] = [];
      }
      chat_data[data.to].push({from: data.from, message: data.message});

      if (data.to === $('#friend_email').val()) {
        append_message(data.from, data.message, data.time, data.id);
      }
    } else {
      if (!chat_data[data.from]) {
        chat_data[data.from] = [];
      }

      chat_data[data.from].push({from: data.from, message: data.message});

      if (data.from === $('#friend_email').val()) {
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
    var new_friend_email = $(this).attr('data-email');
    var new_friend_name = $(this).attr('data-name');

    // Get current friend
    var old_friend = $('#friend_email').val();

    if (new_friend_email === old_friend) {
      return;
    }
    // If user clicked new friend
    $('#ul_friend').each(function() {
      $(this).find('li').each(function(){
        if ($(this).attr('data-email') === old_friend) {
          $(this).removeClass("current");
        }
        else if ($(this).attr('data-email') === new_friend_email) {
          $(this).addClass("current");
        }
      });
    });

    $('#friend_name').html(new_friend_name);
    $('#friend_email').val(new_friend_email);
    all_chat_html.html("");

    // Load message in array from username
    if (chat_data[new_friend_email ]) {
      chat_data[new_friend_email ].forEach(function (item) {
        console.log(item);
        append_message(item.from, item.message, item.time, item.id);
      });
    }
    // loadPreviousMessage();
  });

  // User click send button
  $("#send").click( function() {

    var msgInput = $('#messageInput');
    // Get friend ID and message
    var friend_id = $( "#friend_email" ).val();
    var message = msgInput.val();

    if (friend_id === '' || message === '') {
      return;
    }
    // Emit this message to server
    socket.emit( 'message', { to: friend_id, message: message} );

    // Reset message after send
    msgInput.val('');
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
    var friend_email = $('#friend_email');

    var last_id = first_message.attr('data-id');
    var last_time = first_message.attr('title');

    if (typeof last_time === 'undefined') {
      last_time = begin_time;
      last_id = 'null';
    }

    socket.emit('load previous message', {with: friend_email.val(), last_id: last_id, last_time: last_time});

    console.log("Asking message with " + friend_email.val(), last_id, last_time);
  }

});

function append_message(from, message, time, id) {

  // time format: day_hour-minute-second

  var chat_message = $('#chat_box');

  if (from === me_email) {
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

  if (from === me_email) {
    chat_message.prepend('<p class="user-message" title="' +time+ '" data-id="' + id + '">' +message+ '</p>');
  }
  else {
    chat_message.prepend('<p class="friend-message" title="' +time+ '" data-id="' + id + '">' +message+'</p>');
  }

  var chat_box = document.getElementById("chat_box");
  //chat_box.scrollTop = chat_box.scrollHeight;

}
