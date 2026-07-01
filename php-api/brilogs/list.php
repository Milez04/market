<?php
require_once __DIR__ . "/../config.php";

$pdo = db();

$statement = $pdo->query("SELECT id, title, description, price, sort_order FROM brilogs WHERE active = 1 ORDER BY sort_order ASC, id ASC");
$brilogs = $statement->fetchAll();

if (count($brilogs) > 0) {
    $ids = array_map(fn($item) => (int)$item["id"], $brilogs);
    $placeholders = implode(",", array_fill(0, count($ids), "?"));
    $imageStatement = $pdo->prepare("SELECT id, brilog_id, image_url, sort_order FROM brilog_images WHERE brilog_id IN ({$placeholders}) ORDER BY sort_order ASC, id ASC");
    $imageStatement->execute($ids);
    $imagesByBrilog = [];
    foreach ($imageStatement->fetchAll() as $image) {
        $imagesByBrilog[(int)$image["brilog_id"]][] = $image;
    }
    foreach ($brilogs as &$brilog) {
        $brilog["images"] = $imagesByBrilog[(int)$brilog["id"]] ?? [];
        $brilog["image_url"] = $brilog["images"][0]["image_url"] ?? "";
    }
    unset($brilog);
}

json_response(["brilogs" => $brilogs]);
