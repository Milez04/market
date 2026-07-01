<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
current_admin($pdo);

function brilog_upload_path_from_url(string $url): string
{
    $path = (string)(parse_url($url, PHP_URL_PATH) ?? "");
    if ($path === "" || !str_contains($path, "/uploads/brilogs/")) {
        return "";
    }

    $filename = basename($path);
    if ($filename === "" || $filename === "." || $filename === "..") {
        return "";
    }

    return dirname(__DIR__) . "/uploads/brilogs/" . $filename;
}

function delete_brilog_upload(string $url): void
{
    $path = brilog_upload_path_from_url($url);
    if ($path !== "" && is_file($path)) {
        unlink($path);
    }
}

function load_brilogs(PDO $pdo): array
{
    $statement = $pdo->query("SELECT id, title, description, price, sort_order, active FROM brilogs ORDER BY sort_order ASC, id ASC");
    $brilogs = $statement->fetchAll();
    if (count($brilogs) === 0) {
        return [];
    }

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
    return $brilogs;
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    json_response(["brilogs" => load_brilogs($pdo)]);
}

$data = input();
$id = (int)($data["id"] ?? 0);

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    if ($id <= 0) {
        json_response(["error" => "Brilog id is required"], 422);
    }
    $imageStatement = $pdo->prepare("SELECT image_url FROM brilog_images WHERE brilog_id = ?");
    $imageStatement->execute([$id]);
    $images = $imageStatement->fetchAll();
    $statement = $pdo->prepare("DELETE FROM brilogs WHERE id = ?");
    $statement->execute([$id]);
    foreach ($images as $image) {
        delete_brilog_upload((string)$image["image_url"]);
    }
    json_response(["ok" => true]);
}

$title = trim((string)($data["title"] ?? ""));
$description = trim((string)($data["description"] ?? ""));
$price = (int)($data["price"] ?? 0);
$active = !empty($data["active"]) ? 1 : 0;

if ($title === "" || $description === "" || $price <= 0) {
    json_response(["error" => "Brilog title, description, and price are required"], 422);
}

if ($id > 0) {
    $statement = $pdo->prepare("UPDATE brilogs SET title = ?, description = ?, price = ?, active = ? WHERE id = ?");
    $statement->execute([$title, $description, $price, $active, $id]);
    json_response(["ok" => true, "brilog" => ["id" => $id]]);
}

$sortOrder = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM brilogs")->fetchColumn();
$statement = $pdo->prepare("INSERT INTO brilogs (title, description, price, sort_order, active) VALUES (?, ?, ?, ?, ?)");
$statement->execute([$title, $description, $price, $sortOrder, $active]);

json_response(["ok" => true, "brilog" => ["id" => (int)$pdo->lastInsertId()]]);
