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
          <p class="navbar-text navbar-toggler-right">Signed in as <?php echo $me_email; ?></p>
        </li>
      </ul>
      <input type="hidden" id="me_email" value="<?php echo $me_email; ?>">
    </div>
  </nav>
</header>

<div class="container">
  <div class="row py-4">
    <div class="col-sm-2 rounded mt-2 rounded-bottom temp-border">
      <ul id="ul_friend" class="list-group row cursor-pointer">
      </ul>
    </div>
    <div class="col-sm-9 ml-1 rounded mt-2 p-4 temp-border full-height">
      <div class="friend-info">
        <h2 id="friend_name"></h2>
        <input id="friend_email" type="hidden" value="">
      </div>
      <hr>
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
</body>
<script src="js/jquery-3.2.1.min.js"></script>
<script src="js/tether.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src="js/socket-client.js?v=<?php echo time(); ?>"></script>
</html>
