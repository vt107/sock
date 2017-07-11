<?php
/**
 * Created by PhpStorm.
 * User: VanTho
 * Date: 04/07/2017
 * Time: 9:51 CH
 */
session_start();
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    die;
}

$me_name = $_SESSION['username'];

?>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Chat</title>
    <link href="css/style.css" rel="stylesheet">
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <script src="js/jquery-3.2.1.min.js" ></script>
    <script src="js/socket.io.js"></script>

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

</head>
<body>
<header>
    <!-- Image and text -->
    <nav class="navbar navbar-toggleable-md navbar-inverse bg-primary">
        <button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <a class="navbar-brand" href="">Chat example</a>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item active">
                    <a class="nav-link" href="">Chat <span class="sr-only">(current)</span></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="logout.php">Log out </a>
                </li>
                <li>
                    <p class="navbar-text navbar-toggler-right">Signed in as <?php echo $me_name; ?></p>
                </li>
            </ul>
            <input type="hidden" id="me_name" value="<?php echo $me_name; ?>">
        </div>
    </nav>
</header>

<div class="container">
    <div class="row py-4">
        <div class="col-sm-2 rounded mt-2 rounded-bottom temp-border">
                <ul id="ul_friend" class="list-group row cursor-pointer">
                    <li data-username="abc" class="list-group-item online">Loading</li>
                </ul>
        </div>
        <div class="col-sm-9 ml-1 rounded mt-2 p-4 temp-border full-height">
            <div class="friend-info">
                <h2 id="friend_name">Friend</h2>
                <input id="friend_username" type="hidden" value="friend_username">
            </div>
            <hr>
            <div class="chat" id="chat-box">
                <p class="user-msg">Hello!</p>
                <p class="friend-msg">Goodbye!</p>
            </div>
            <hr>
            <div class="col-lg-12">
                <div class="input-group">
                    <input type="text" id="messageInput" class="form-control" placeholder="Enter your message">
                    <span class="input-group-btn">
                        <button id="send" class="btn btn-primary" type="button">Send</button>
                    </span>
                </div>
            </div>

        </div>
        <button id="load_pre_msg" class="btn btn-primary">Load previous message</button>
    </div>
</div>
</body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js"
        integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js"
        integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>
<script src="js/socket-client.js"></script>
</html>