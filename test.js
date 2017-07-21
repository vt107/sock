// var dateTime = require('node-datetime');
// var dt = dateTime.create();
// var time_now = new Date("2017-07-12 09:26:30");
// console.log(time_now);
var mysql = require('mysql');

// get time from system
//var dateTime = require('node-datetime');
// =======================================
// Database
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "vantho",
    database: "socket"
});

var queryy = "INSERT INTO `chat_messages` (`id`, `message`, `created_time`, `sender`, `session_id`) VALUES (NULL, 'go fetch this file. when you cou co', '2017-07-20 17:20:09', 'user1', '14')"
for (var i = 0; i <= 50000 ; i++) {
    if ( i % 2 === 0) {
        queryy += ", (NULL, 'This is an random message...', '2017-07-20 17:20:11', 'user2', '14')";
    }
    else {
        queryy += ", (NULL, 'This is an random message...', '2017-07-20 17:20:11', 'user1', '14')";
    }

}
var max = 1000;
function insert() {
    con.query(queryy, function (error, result) {});
}
for (var j = 0; j < max ; j++) {
    setTimeout(function () {
        insert();
    },1);
}