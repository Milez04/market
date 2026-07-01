<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$id = (int)($_GET["id"] ?? 0);

if ($id <= 0) {
    json_response(["error" => "Brilog id is required"], 422);
}

$statement = $pdo->prepare("SELECT id, title, description, price, sort_order FROM brilogs WHERE id = ? AND active = 1");
$statement->execute([$id]);
$brilog = $statement->fetch();

if (!$brilog) {
    json_response(["error" => "Brilog not found"], 404);
}

$imageStatement = $pdo->prepare("SELECT id, brilog_id, image_url, sort_order FROM brilog_images WHERE brilog_id = ? ORDER BY sort_order ASC, id ASC");
$imageStatement->execute([$id]);
$brilog["images"] = $imageStatement->fetchAll();
$brilog["image_url"] = $brilog["images"][0]["image_url"] ?? "";

json_response(["brilog" => $brilog]);
