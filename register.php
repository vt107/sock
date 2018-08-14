<?php
include "config.php";
if (isset($_SESSION['email'], $_SESSION['logged_in']) && $_SESSION['logged_in']) {
  header("Location: index.php");
  exit();
}

if (isset($_POST['email'], $_POST['password'], $_POST['name'], $_POST['email'])) {
  $email = $_POST['email'];

  if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $password = $_POST['password'];
    $name = $_POST['name'];
    if (strlen($password) < 5) {
      $error = 'Mat khau chua du dai!';
    } else {
      $stmt = $connection->prepare("SELECT id FROM users WHERE email=?");
      $stmt->bind_param("s", $email);
      $stmt->execute();
      $stmt->store_result();
      $rows = $stmt->num_rows;
      $stmt->close();
      if ($rows == 0) {
        $password = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $connection->prepare("INSERT INTO `users`( `email`, `password`, `name`) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $email, $password, $name);
        $stmt->execute();
        $stmt->close();
        $success = 'Dang ky thanh cong!';
      }
    }
  } else {
    $error = 'Email chua dung dinh dang!';
  }
}
?>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Login</title>
  <link href="css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <a class="navbar-brand" href="#">Navbar</a>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>

  <div class="collapse navbar-collapse" id="navbarSupportedContent">
    <ul class="navbar-nav mr-auto">
      <li class="nav-item active">
        <a class="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#">Link</a>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Dropdown
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
          <a class="dropdown-item" href="#">Action</a>
          <a class="dropdown-item" href="#">Another action</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#">Something else here</a>
        </div>
      </li>
      <li class="nav-item">
        <a class="nav-link disabled" href="#">Disabled</a>
      </li>
    </ul>
  </div>
</nav>
<div class="container">
  <form action="" method="post" id="register_form">
    <div class="row py-5">
      <div class="col-md-5 pt-3 m-auto form-control">
        <?php if (isset($error)): ?>
          <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            <?php echo $error ?>
            </div>
          <?php elseif (isset($success)): ?>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <?php echo $success ?>
            </div>
          <?php endif; ?>
        <div class="form-group">
          <label>Email</label>
          <input name="email" type="email" required placeholder="email" class="form-control">
        </div>
        <div class="form-group">
          <label>Name</label>
          <input name="name" required placeholder="name" class="form-control">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" name="password" placeholder="Password" class="form-control" required minlength="5">
        </div>
        <div class="form-group">
          <label>Re Paswword</label>
          <input type="password" id="re_password" placeholder="Password" class="form-control" required minlength="5">
        </div>
        <div class="form-group">
          <button class="btn btn-success btn-block">Submit</button>
        </div>
        <div class="col-md-12">
          Da co tai khoan? <a href="login.php">Dang nhap</a>
        </div>
      </div>
    </div>
  </form>
</div>
<script src="js/jquery-3.2.1.min.js"></script>
<script>
  $('#register_form').submit(function(e) {
    var password = $('#password').val();
    var re_password = $('#re_password').val();
    if (password !== re_password) {
      e.preventDefault();
      alert('mk xac nhan');
    }
  });
</script>
</body>
</html>
