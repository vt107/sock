<?php
include "config.php";
if (!isset($_SESSION['email'], $_SESSION['logged_in'])) {
  header("Location: login.php");
  exit();
}
$me_email = $_SESSION['email'];
$me_id = $_SESSION['user_id'];

?>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Chat</title>
  <link href="css/style.css" rel="stylesheet">
  <link href="css/bootstrap.min.css?v=<?php echo time(); ?>" rel="stylesheet">
  <script src="js/jquery-3.2.1.min.js" ></script>
  <script src="js/socket.io.js"></script>

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

</head>
<body>
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <a class="navbar-brand" href="index.php">Chat</a>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>

  <div class="collapse navbar-collapse" id="navbarSupportedContent">
    <ul class="navbar-nav mr-auto">
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <?php echo $me_email; ?>
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
          <a class="dropdown-item" href="#">Đổi mật khẩu</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="logout.php">Đăng xuất</a>
        </div>
      </li>
    </ul>
  </div>
</nav>

<input type="hidden" id="me_email" value="<?php echo $me_email; ?>">
<div class="container">
  <div class="row">
    <div class="col-md-3 rounded mt-2 rounded-bottom temp-border">
      <ul id="ul_friend" class="list-group row cursor-pointer">
      </ul>
    </div>
    <div class="col-md-9 rounded mt-2 p-4 temp-border full-height">
      <div class="friend-info">
        <h2 id="friend_name"></h2>
        <input id="friend_email" type="hidden" value="">
      </div>
      <hr>
      <div class="col-md-12">
        <div class="chat" id="chat_box">
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
    </div>
  </div>
</div>
</body>
<script src="js/jquery-3.2.1.min.js"></script>
<script src="js/tether.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src="js/socket-client.js?v=<?php echo time(); ?>"></script>
</html>
