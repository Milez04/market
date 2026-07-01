<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$user = current_user($pdo);

$statement = $pdo->prepare("SELECT id, title, preview, updated_at, created_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC");
$statement->execute([$user["id"]]);

json_response(["projects" => $statement->fetchAll()]);
