<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$user = current_user($pdo);
$data = input();

$projectId = isset($data["id"]) && $data["id"] !== "new" ? (int)$data["id"] : 0;
$title = trim((string)($data["title"] ?? "Untitled card"));
$preview = (string)($data["preview"] ?? "");
$designJson = (string)($data["design_json"] ?? "");

if ($projectId > 0) {
    $statement = $pdo->prepare("UPDATE projects SET title = ?, preview = ?, design_json = ? WHERE id = ? AND user_id = ?");
    $statement->execute([$title, $preview, $designJson, $projectId, $user["id"]]);
} else {
    $statement = $pdo->prepare("INSERT INTO projects (user_id, title, preview, design_json) VALUES (?, ?, ?, ?)");
    $statement->execute([$user["id"], $title, $preview, $designJson]);
    $projectId = (int)$pdo->lastInsertId();
}

json_response(["project" => ["id" => $projectId, "title" => $title, "preview" => $preview]]);
