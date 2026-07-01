<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
current_admin($pdo);

$statement = $pdo->query(
    "SELECT users.id, users.name, users.email, users.created_at,
      (SELECT COUNT(*) FROM projects WHERE projects.user_id = users.id) AS project_count
     FROM users
     ORDER BY users.created_at DESC",
);

json_response(["users" => $statement->fetchAll()]);
