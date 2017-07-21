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

    // Create an socket
    // var socket = io('ws://127.0.0.1:3000/admin', {transports: ['websocket'], query: {'username':me_name}});
    //var socket = io('ws://192.168.1.98:3000/user');

    var socket = io('ws://127.0.0.1:3000/admin', {transports: ['websocket']});

    socket.onerror = function () {
        console.log("error");
    };
    // ========================Socket event=============================

    // When client connect to server (include reconnect)
    socket.on( 'connect' , function () {
        console.log("connected");
    });

    // Client try to connect the server 5 times after lost connection
    socket.on( 'reconnect', function () {
        //
    });

    // On message event
    socket.on( 'message', function( data ) {

    });

    // On error event
    socket.on( 'err', function( data ) {

    });

    socket.on('statistic', function (data) {
        $('#concurrent_connection').html(data.concurrent);
        $('#total_message').html(data.total_message);
        $('#total_session').html(data.total_session);
    });


    $('#get_statistic').click(function () {
       socket.emit('get statistic', {});
    });
    // =====================================================



});
