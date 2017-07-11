<?php
/**
 * Created by PhpStorm.
 * User: VanTho
 * Date: 04/07/2017
 * Time: 10:03 CH
 */
session_start();

$requested_username = '';
if (isset($_GET['user']) && isset($_SESSION['username'])) {

    $my_username = $_SESSION['username'];

    $requested_username = addslashes($_GET['user']);
    $data = '';

    include_once "MXH/Connection.php";

    $mysql = new MXH\Connection();

    if ($arr = $mysql->getUserData($requested_username)) {
        $data = $arr;
    }
}
else {
    header("Location: index.php");
    exit();
}
?>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>
    <?php
        if (isset($data['username'])) {
            echo $data['username'];
        }
        else {
            echo "Not Found";
        }
    ?>
    </title>
    <script src="js/jquery-3.2.1.min.js"></script>

</head>

<body>
<h2>User Info</h2>
<?php
    if (isset($data['username']) && isset($data['info'])) {

        $text = '';
        $val = '';

        echo ("<h3>Username: {$data['username']}</h3>");

        echo ("<input id='target_id' type='hidden' value='{$data['username']}'>");

        echo ("<h3>Info: {$data['info']}</h3>");

        $friendship = $mysql->getFriendStatus($my_username, $requested_username);

        if (!$friendship) {
            $text = "Send friend request";
            $val = "send-request";
        }
        else {
            if ($friendship['status'] == '0') {
                if ($friendship['user_action_id'] == $my_username) {
                    $text = "Your friend request is pending...";
                    $val = "delete-request";
                }
                else {
                    echo "<h4>This user sent an friend request to you!</h4>";
                    $text = "Accept this request";
                    $val = "accept-request";
                }
            }
            elseif ($friendship['status'] == '1') {
                echo ("<h4>This is your friend!</h4>");
                $text = "Unfriend";
                $val = "delete-request";
            }
        }

        echo ("<button id='user-action' value='{$val}'>{$text}</button>");
        echo ("<script src=\"js/js_view-user.js\"></script>");


    }
    else {
        echo ("<h4>Username {$requested_username} not found!</h4>");
    }

?>

<br>
<a href="index.php" target="_self">Return Home</a>

</body>

</html>
