<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$user = current_user($pdo);
$projectId = (int)($_GET["id"] ?? 0);

if ($projectId <= 0) {
    json_response(["error" => "Project id is required"], 422);
}

$statement = $pdo->prepare("SELECT id, title, preview, design_json, updated_at, created_at FROM projects WHERE id = ? AND user_id = ?");
$statement->execute([$projectId, $user["id"]]);
$project = $statement->fetch();

if (!$project) {
    json_response(["error" => "Project not found"], 404);
}

json_response(["project" => $project]);
