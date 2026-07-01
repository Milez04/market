<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$user = current_user($pdo);
$data = input();
$projectId = (int)($data["id"] ?? 0);

if ($projectId <= 0) {
    json_response(["error" => "Project id is required"], 422);
}

$statement = $pdo->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
$statement->execute([$projectId, $user["id"]]);

json_response(["ok" => $statement->rowCount() > 0]);
