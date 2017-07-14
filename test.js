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
    password: "",
    database: "socket"
});


var query = "SELECT DATE_FORMAT(chat_messages.created_time,'%Y-%m-%d %H:%i:%S') as created_time FROM `chat_messages` WHERE id = '222'";
con.query(query, function (error, result) {

    console.log(result);
});

con.end();