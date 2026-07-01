<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$user = current_user($pdo);
$data = input();

$projectId = isset($data["project_id"]) ? (int)$data["project_id"] : null;
$title = trim((string)($data["title"] ?? "Card order"));
$preview = (string)($data["preview"] ?? "");
$whatsappText = (string)($data["whatsapp_text"] ?? "");

$statement = $pdo->prepare("INSERT INTO orders (user_id, project_id, title, preview, whatsapp_text, status) VALUES (?, ?, ?, ?, ?, 'whatsapp')");
$statement->execute([$user["id"], $projectId ?: null, $title, $preview, $whatsappText]);

json_response(["order" => ["id" => (int)$pdo->lastInsertId(), "title" => $title, "status" => "whatsapp"]]);
