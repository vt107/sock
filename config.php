<?php
$db_host = "localhost";
$db_username = "root";
$db_password = "vantho";
$db_name = "chat";

$connection = mysqli_connect($db_host, $db_username, $db_password);

if (!$connection) {
  die('Could not connect: ' . $connection->error);
}

mysqli_select_db($connection, $db_name) or die($connection->error);

$connection->query("SET NAMES utf8");

if (!isset($_SESSION)) {
  session_start();
}
