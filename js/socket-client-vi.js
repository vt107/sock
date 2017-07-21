<<<<<<< HEAD
/**
 * Created by VanTho on 08/07/2017.
 */
var me_name = $('#me_name').val();
var chat_data = [];

$(document).keypress(function(e) {
    if(e.which === 13) {
        $( "#send" ).trigger( "click" );
    }
});


$( document ).ready(function () {

    // Tạo 1 socket và gửi yêu cầu kết nối tới server, chỉ cần thay me_name thành username hiện tại
    var socket = io('ws://192.168.1.98:3000/user', {transports: ['websocket'], query: {'username':me_name}});

    socket.onerror = function (event) {
      console.log("error");
    };
    // ========================Socket event=============================


    // Hàm này lắng nghe sự kiện cập nhật bạn bè, khi người dùng đăng nhập hệ thống và gửi yêu cầu kết nối, server chấp nhận
    // và emit lại sự kiện này, dữ liệu bên trong bao gồm "list" là một mảng chứa danh sách bạn bè, mảng này là 1 mảng các đối tượng

    // bao gồm 3 thông số username, name và online. Nếu online = 1 là đang online, = 0 nếu ngược lại
    // Ví dụ: [{username:'user2', name: 'two', online: 1}]
    socket.on( 'update-friend', function (data) {

        $('#ul_friend').html("");

        data.list.forEach(function (friend, index) {

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


    // Khi có một bạn bè trong danh sách bạn bè online, hàm này được server emit, nội dung bên trong gồm
    // friend_id: username của bạn bè online đó
    socket.on ('friend online', function (data) {

        // data.username
        console.log(data.friend_id + " is online!");
        $('#ul_friend').on("li").find("[data-username='" + data.friend_id + "']").addClass('online');

    });


    // Khi có một bạn bè trong danh sách bạn bè ofline, hàm này được server emit, nội dung bên trong gồm
    // friend_id: username của bạn bè ofline đó
    socket.on ('friend offline', function (data) {

        // data.username
        console.log(data.friend_id + " is offline!");
        $('#ul_friend').on("li").find("[data-username='" + data.friend_id + "']").removeClass('online');
    });

    // When client connect to server (include reconnect)
    socket.on( 'connect' , function () {
        console.log("connected");
    });


    // Hàm này nhận tin nhắn do chính client này gửi lên và hiển thị lại trên máy, bao gồm:
    // inn: username của người mà mình đang chat cùng (nghĩa là tin nhắn đó nằm trong cuộc hội thoại với người nào)
    // message: nội dung tin nhắn
    // time: thời gian của tin nhắn đó
    socket.on ('self message', function (data) {

        if (typeof chat_data[data.inn] === 'undefined') {
            chat_data[data.inn] = [];
        }
        chat_data[data.inn].push({from: me_name, message: data.message, time: data.time});

        // If current chat box is open
        if ($('#friend_username').val() === data.inn) {
            append_mesage(me_name, data.message, data.time);
        }
    });


    // Server trả những tin nhắn cũ, bao gồm:
    // inn: username của người mà mình đang chat cùng (để xác định những tin nhắn này trong cuộc hội thoại với ai)
    // arr: 1 mảng chứa những tin nhắn cũ, các phần tử trong đó bao gồm:
        // sender: người mà đã gửi tin nhắn này cho mình
        // message: nội dung tin nhắn
        // created_time: thời gian của tin nhắn
        // id: Id của tin nhắn
            // created_time và id của tin nhắn dùng để trả về tin nhắn cũ hơn khi có yêu cầu trả tin nhắn cũ
            // Nếu arr (thông thường là mảng) mà được trả về dưới dạng string, giá trị là 'end' thì nghĩa là
            // không còn tin nhắn cũ hơn
    socket.on ('pre message', function (data) {

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

                prepend_mesage(item.sender, item.message, item.created_time, item.id);
            });
        }
    });

    // Khi nhận được 1 tin nhắn mới tới, bao gồm:
    // from: username người gửi
    // message: nội dung tin nhắn\
    // time: thời gian của tin nhắn đó (giống như created_time)
    socket.on( 'message', function( data ) {

        // If it's user message
        if (data.from === me_name) {
            if (typeof chat_data[data.to] === 'undefined') {
                chat_data[data.to] = [];
            }
            chat_data[data.to].push({from: data.from, message: data.message});

            if (data.to === $('#friend_username').val()) {
                append_mesage(data.from, data.message, data.time);
            }
        }
        else {
            if (typeof chat_data[data.from] === 'undefined') {
                chat_data[data.from] = [];
            }

            chat_data[data.from].push({from: data.from, message: data.message});

            if (data.from === $('#friend_username').val()) {
                append_mesage(data.from, data.message, data.time, data.id);
            }
        }

    });

    // Gửi tin nhắn
    /*
    emit một sự kiện lên server, với tên là 'message', dữ liệu bên trong gồm:
    to: username của người muốn gửi tin nhắn
    message: nội dung của tin nhắn
    time: thời gian của tin nhắn đó
    */
    $( "#send" ).click( function() {

        // Get friend ID and message
        var friend_id = $( "#friend_username" ).val();
        var message = $( "#messageInput" ).val();

        if (friend_id === '' || message === '') {
            return;
        }

        var date = new Date();
        var current_time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        // Emit this message to server
        socket.emit( 'message', { to: friend_id, message: message, time: current_time } );

        // Reset message after send
        $('#messageInput').val("");
        console.log("Sending....");

    });


    // Tải tin nhắn cũ
    // Client emit một sự kiện lên server, với tên là 'load pre message', bao gồm:
        /*
        inn: username mà mình muốn lấy những tin nhắn cùng chat với người đó
        last_id: ID của tin nhắn cũ cuối cùng (nếu không có tin nhắn cũ nào từng được tải, thì để biến này là string có giá trị "null")
        last_time: thời gian của tin nhắn cuối cùng, nếu không có tin nhắn cuối cùng nào thì lấy thời gian hiện tại của hệ thống, ví dụ 2017-07-14 10:00:05
        */
    function loadPreviousMessage() {
        var last_id = $('#chat_box > p:first-child').attr('data-id');
        var last_time = $('#chat_box > p:first-child').attr('title');

        if (typeof last_time === 'undefined') {
            var date = new Date();
            last_time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            last_id = 'null';
        }

        // Khi được 
        socket.emit('load pre message', {inn: $('#friend_username').val(), last_id: last_id, last_time: last_time});

        console.log("Asking message before " + last_time + " and id < " + last_id);
    }

=======
/**
 * Created by VanTho on 08/07/2017.
 */
var me_name = $('#me_name').val();
var chat_data = [];

$(document).keypress(function(e) {
    if(e.which === 13) {
        $( "#send" ).trigger( "click" );
    }
});


$( document ).ready(function () {

    // Tạo 1 socket và gửi yêu cầu kết nối tới server, chỉ cần thay me_name thành username hiện tại
    var socket = io('ws://192.168.1.98:3000/user', {transports: ['websocket'], query: {'username':me_name}});

    socket.onerror = function (event) {
      console.log("error");
    };
    // ========================Socket event=============================


    // Hàm này lắng nghe sự kiện cập nhật bạn bè, khi người dùng đăng nhập hệ thống và gửi yêu cầu kết nối, server chấp nhận
    // và emit lại sự kiện này, dữ liệu bên trong bao gồm "list" là một mảng chứa danh sách bạn bè, mảng này là 1 mảng các đối tượng

    // bao gồm 3 thông số username, name và online. Nếu online = 1 là đang online, = 0 nếu ngược lại
    // Ví dụ: [{username:'user2', name: 'two', online: 1}]
    socket.on( 'update-friend', function (data) {

        $('#ul_friend').html("");

        data.list.forEach(function (friend, index) {

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


    // Khi có một bạn bè trong danh sách bạn bè online, hàm này được server emit, nội dung bên trong gồm
    // friend_id: username của bạn bè online đó
    socket.on ('friend online', function (data) {

        // data.username
        console.log(data.friend_id + " is online!");
        $('#ul_friend').on("li").find("[data-username='" + data.friend_id + "']").addClass('online');

    });


    // Khi có một bạn bè trong danh sách bạn bè ofline, hàm này được server emit, nội dung bên trong gồm
    // friend_id: username của bạn bè ofline đó
    socket.on ('friend offline', function (data) {

        // data.username
        console.log(data.friend_id + " is offline!");
        $('#ul_friend').on("li").find("[data-username='" + data.friend_id + "']").removeClass('online');
    });

    // When client connect to server (include reconnect)
    socket.on( 'connect' , function () {
        console.log("connected");
    });


    // Hàm này nhận tin nhắn do chính client này gửi lên và hiển thị lại trên máy, bao gồm:
    // inn: username của người mà mình đang chat cùng (nghĩa là tin nhắn đó nằm trong cuộc hội thoại với người nào)
    // message: nội dung tin nhắn
    // time: thời gian của tin nhắn đó
    socket.on ('self message', function (data) {

        if (typeof chat_data[data.inn] === 'undefined') {
            chat_data[data.inn] = [];
        }
        chat_data[data.inn].push({from: me_name, message: data.message, time: data.time});

        // If current chat box is open
        if ($('#friend_username').val() === data.inn) {
            append_mesage(me_name, data.message, data.time);
        }
    });


    // Server trả những tin nhắn cũ, bao gồm:
    // inn: username của người mà mình đang chat cùng (để xác định những tin nhắn này trong cuộc hội thoại với ai)
    // arr: 1 mảng chứa những tin nhắn cũ, các phần tử trong đó bao gồm:
        // sender: người mà đã gửi tin nhắn này cho mình
        // message: nội dung tin nhắn
        // created_time: thời gian của tin nhắn
        // id: Id của tin nhắn
            // created_time và id của tin nhắn dùng để trả về tin nhắn cũ hơn khi có yêu cầu trả tin nhắn cũ
            // Nếu arr (thông thường là mảng) mà được trả về dưới dạng string, giá trị là 'end' thì nghĩa là
            // không còn tin nhắn cũ hơn
    socket.on ('pre message', function (data) {

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

                prepend_mesage(item.sender, item.message, item.created_time, item.id);
            });
        }
    });

    // Khi nhận được 1 tin nhắn mới tới, bao gồm:
    // from: username người gửi
    // message: nội dung tin nhắn\
    // time: thời gian của tin nhắn đó (giống như created_time)
    socket.on( 'message', function( data ) {

        // If it's user message
        if (data.from === me_name) {
            if (typeof chat_data[data.to] === 'undefined') {
                chat_data[data.to] = [];
            }
            chat_data[data.to].push({from: data.from, message: data.message});

            if (data.to === $('#friend_username').val()) {
                append_mesage(data.from, data.message, data.time);
            }
        }
        else {
            if (typeof chat_data[data.from] === 'undefined') {
                chat_data[data.from] = [];
            }

            chat_data[data.from].push({from: data.from, message: data.message});

            if (data.from === $('#friend_username').val()) {
                append_mesage(data.from, data.message, data.time, data.id);
            }
        }

    });

    // Gửi tin nhắn
    /*
    emit một sự kiện lên server, với tên là 'message', dữ liệu bên trong gồm:
    to: username của người muốn gửi tin nhắn
    message: nội dung của tin nhắn
    time: thời gian của tin nhắn đó
    */
    $( "#send" ).click( function() {

        // Get friend ID and message
        var friend_id = $( "#friend_username" ).val();
        var message = $( "#messageInput" ).val();

        if (friend_id === '' || message === '') {
            return;
        }

        var date = new Date();
        var current_time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        // Emit this message to server
        socket.emit( 'message', { to: friend_id, message: message, time: current_time } );

        // Reset message after send
        $('#messageInput').val("");
        console.log("Sending....");

    });


    // Tải tin nhắn cũ
    // Client emit một sự kiện lên server, với tên là 'load pre message', bao gồm:
        /*
        inn: username mà mình muốn lấy những tin nhắn cùng chat với người đó
        last_id: ID của tin nhắn cũ cuối cùng (nếu không có tin nhắn cũ nào từng được tải, thì để biến này là string có giá trị "null")
        last_time: thời gian của tin nhắn cuối cùng, nếu không có tin nhắn cuối cùng nào thì lấy thời gian hiện tại của hệ thống, ví dụ 2017-07-14 10:00:05
        */
    function loadPreviousMessage() {
        var last_id = $('#chat_box > p:first-child').attr('data-id');
        var last_time = $('#chat_box > p:first-child').attr('title');

        if (typeof last_time === 'undefined') {
            var date = new Date();
            last_time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            last_id = 'null';
        }

        // Khi được 
        socket.emit('load pre message', {inn: $('#friend_username').val(), last_id: last_id, last_time: last_time});

        console.log("Asking message before " + last_time + " and id < " + last_id);
    }

>>>>>>> 30e7aab3ef1b8269b8bea7403909bf89f29bd313
});