<?php
/**
 * Created by PhpStorm.
 * User: VanTho
 * Date: 06/07/2017
 * Time: 3:12 CH
 */
session_start();
unset($_SESSION['username']);
header("Location: login.php");