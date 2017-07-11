<?php
/**
 * Created by PhpStorm.
 * User: VanTho
 * Date: 04/07/2017
 * Time: 9:38 CH
 */
session_start();
if (isset($_SESSION['username'])) {

    header("Location: index.php");
    exit();
}

$error = '';

if (isset($_POST['username']) && isset($_POST['password'])) {

    include_once "dtb/Connection.php";
    $username = addslashes($_POST['username']);
    $password = addslashes($_POST['password']);

    $dtb = new \dtb\Connection();
    if ($name = $dtb->login($username, $password)) {

        $_SESSION['username'] = $username;
        $_SESSION['name'] = $name;
        //setcookie("username", $username, time() + 3600);

        header("Location: index.php");
        die;
    }
    else {
        $error = "Username or password is incorrect!";
    }

}

?>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <link href="css/bootstrap.css" rel="stylesheet">
</head>
<body>
<div class="container">
    <form action="" method="post">
        <div class="col">
            <div class="col-md-6">
                <div class="col-md-4">
                    <p><?php echo $error; ?></p>
                    <input type="text" name="username" required placeholder="Username">
                </div>
                <div class="col-md-4">
                    <input type="password" name="password" required placeholder="******">
                </div>
                <div class="col-md-3">
                    <input type="submit" value="Submit" class="btn btn-primary">
                </div>
            </div>
        </div>
    </form>
</div>
</body>
</html>