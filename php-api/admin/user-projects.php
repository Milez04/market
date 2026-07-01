<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
current_admin($pdo);
$userId = (int)($_GET["user_id"] ?? 0);

if ($userId <= 0) {
    json_response(["error" => "User id is required"], 422);
}

$userStatement = $pdo->prepare("SELECT id, name, email, created_at FROM users WHERE id = ?");
$userStatement->execute([$userId]);
$user = $userStatement->fetch();

if (!$user) {
    json_response(["error" => "User not found"], 404);
}

$projectStatement = $pdo->prepare("SELECT id, title, preview, design_json, updated_at, created_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC");
$projectStatement->execute([$userId]);

json_response(["user" => $user, "projects" => $projectStatement->fetchAll()]);
