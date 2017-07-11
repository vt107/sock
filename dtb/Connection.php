<?php
/**
 * Created by PhpStorm.
 * User: VanTho
 * Date: 04/07/2017
 * Time: 5:12 CH
 */

namespace DTB;

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'mxh');




class Connection
{

    protected $conn;
    public function __construct()
    {
        $this->conn = new \mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    }

    public function checkUsername($username) {

        $username = $this->Quote($username);

        $query = "SELECT";
        $query .= " * ";
        $query .= "FROM user";
        $query .= " WHERE ";
        $query .= "username = {$username}";

        if ($result = $this->conn->query($query)) {

            return true;
        }
        else {
            return false;
        }

    }

    public function login($username, $password) {
        $username = $this->Quote($username);
        $password = $this->Quote($password);

        $query = "SELECT";
        $query .= " name ";
        $query .= "FROM user";
        $query .= " WHERE ";
        $query .= "username = {$username} AND password = {$password}";

        $result = $this->conn->query($query);

        if (mysqli_num_rows($result) === 1) {
            $row = mysqli_fetch_assoc($result);
            return $row['name'];
        }
        else {
            return false;
        }

    }

    public function getUserData($username) {

        $username = $this->Quote($username);

        $query = "SELECT";
        $query .= " username, info ";
        $query .= " FROM ";
        $query .= "user";
        $query .= " WHERE ";
        $query .= "username = {$username}";

        $result = $this->conn->query($query);

        if (mysqli_num_rows($result) == 0) {
            return false;
        }
        else {

                $row = mysqli_fetch_assoc($result);
                $arr = array(
                    'username' => $row['username'],
                    'info' => $row['info'],
                );
                return $arr;
        }

    }

    public function addFriendRequest($user_id1, $user_id2, $user_action_id) {

        $user_id1 = $this->Quote($user_id1);
        $user_id2 = $this->Quote($user_id2);
        $user_action_id = $this->Quote($user_action_id);

        $query = "INSERT INTO";
        $query .= " `relationship` (`user1`, `user2`, `status`, `user_action_id`)";
        $query .= " VALUES ";
        $query .= "({$user_id1}, {$user_id2}, '0', {$user_action_id});";

        $this->conn->query($query);

    }

    public function acceptFriendRequest($user_id1, $user_id2) {

        $user_id1 = $this->Quote($user_id1);
        $user_id2 = $this->Quote($user_id2);

        $query = "UPDATE ";
        $query .= "`relationship`";
        $query .= " SET ";
        $query .= "`status` = '1'";
        $query .= " WHERE ";
        $query .= "`relationship`.`user1` = {$user_id2}";
        $query .= " AND ";
        $query .= "`relationship`.`user2` = {$user_id1};";

        $this->conn->query($query);

    }

    public function deleteFriendRequest($user_id1, $user_id2) {

        $user_id1 = $this->Quote($user_id1);
        $user_id2 = $this->Quote($user_id2);

        $query = "DELETE FROM";
        $query .="`relationship`";
        $query .= " WHERE ";
        $query .= "(`relationship`.`user1` = {$user_id2} AND `relationship`.`user2` = {$user_id1})";
        $query .= " OR ";
        $query .= "(`relationship`.`user1` = {$user_id1} AND `relationship`.`user2` = {$user_id2});";

        $this->conn->query($query);
    }

    public function getFriendStatus($user_id1, $user_id2) {

        $user_id1 = $this->Quote($user_id1);
        $user_id2 = $this->Quote($user_id2);

        $query = "SELECT";
        $query .= " status, user_action_id ";
        $query .= " FROM ";
        $query .="`relationship`";
        $query .= " WHERE ";
        $query .= "(`relationship`.`user1` = {$user_id1} AND `relationship`.`user2` = {$user_id2})";
        $query .= " OR ";
        $query .= "(`relationship`.`user1` = {$user_id2} AND `relationship`.`user2` = {$user_id1});";

        $result = $this->conn->query($query);

        if (mysqli_num_rows($result) == 0) {
            return false;
        }
        else {
            $row = mysqli_fetch_assoc($result);

            return array(
                'status' => $row['status'],
                'user_action_id' => $row['user_action_id'],
            );
        }

    }
    public function Quote($input) {
        return "'{$input}'";
    }
}