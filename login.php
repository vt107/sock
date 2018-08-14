<?php
include "config.php";
if (isset($_SESSION['email'], $_SESSION['logged_in']) && $_SESSION['logged_in']) {
    header("Location: index.php");
    exit();
}

if (isset($_POST['email']) && isset($_POST['password'])) {
  $email = $_POST['email'];
  $password = $_POST['password'];

  $stmt = $connection->prepare("SELECT id, password FROM users WHERE email=?");
  $stmt->bind_param("s", $email);
  $stmt->execute();
  $result = $stmt->get_result();
  $stmt->close();
  if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
      $_SESSION['email'] = $email;
      $_SESSION['user_id'] = $user['id'];
      $_SESSION['logged_in'] = true;
      header('Location: index.php');
      exit();
    } else {
      $error = 'Sai mật khẩu!';
    }
  } else {
    $error = 'Email này không tồn tại!';
    // guacamole
  }
}
?>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Đăng nhập</title>
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
  <form action="" method="post">
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

        <h3>Đăng nhập</h3>

        <div class="form-group">
          <label>Email</label>
          <input name="email" type="email" required placeholder="Email" class="form-control">
        </div>
        <div class="form-group">
          <label>Mật khẩu</label>
          <input type="password" name="password" placeholder="Mật khẩu" class="form-control">
        </div>
        <div class="form-group">
          <button class="btn btn-success btn-block">Đăng nhập</button>
        </div>
        <div class="col-md-12">
          Chưa có tài khoản? <a href="register.php">Đăng ký</a>
        </div>
      </div>
    </div>
  </form>
</div>
</body>
</html>
