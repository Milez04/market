<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$user = current_user($pdo);

$statement = $pdo->prepare("SELECT id, project_id, title, preview, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC");
$statement->execute([$user["id"]]);

json_response(["orders" => $statement->fetchAll()]);
