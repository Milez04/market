<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
current_admin($pdo);

function brilog_image_url(string $filename): string
{
    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host = $_SERVER["HTTP_HOST"] ?? "localhost";
    $scriptDir = str_replace("\\", "/", dirname($_SERVER["SCRIPT_NAME"] ?? ""));
    $apiBase = preg_replace("#/admin$#", "", $scriptDir);
    return "{$scheme}://{$host}{$apiBase}/uploads/brilogs/{$filename}";
}

function brilog_image_path_from_url(string $url): string
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

function delete_brilog_image_file(string $url): void
{
    $path = brilog_image_path_from_url($url);
    if ($path !== "" && is_file($path)) {
        unlink($path);
    }
}

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    $data = input();
    $id = (int)($data["id"] ?? 0);
    if ($id <= 0) {
        json_response(["error" => "Image id is required"], 422);
    }
    $statement = $pdo->prepare("SELECT brilog_id, image_url FROM brilog_images WHERE id = ?");
    $statement->execute([$id]);
    $image = $statement->fetch();
    if (!$image) {
        json_response(["error" => "Image not found"], 404);
    }
    $delete = $pdo->prepare("DELETE FROM brilog_images WHERE id = ?");
    $delete->execute([$id]);
    delete_brilog_image_file((string)$image["image_url"]);
    json_response(["ok" => true, "brilog_id" => (int)$image["brilog_id"]]);
}

$brilogId = (int)($_POST["brilog_id"] ?? 0);

if ($brilogId <= 0) {
    json_response(["error" => "Brilog id is required"], 422);
}

$brilogStatement = $pdo->prepare("SELECT id FROM brilogs WHERE id = ?");
$brilogStatement->execute([$brilogId]);
if (!$brilogStatement->fetch()) {
    json_response(["error" => "Brilog not found"], 404);
}

$countStatement = $pdo->prepare("SELECT COUNT(*) FROM brilog_images WHERE brilog_id = ?");
$countStatement->execute([$brilogId]);
if ((int)$countStatement->fetchColumn() >= 10) {
    json_response(["error" => "Maximum 10 photos are allowed"], 422);
}

if (empty($_FILES["image"]) || !is_uploaded_file($_FILES["image"]["tmp_name"])) {
    json_response(["error" => "Image file is required"], 422);
}

$file = $_FILES["image"];
$extension = strtolower(pathinfo((string)$file["name"], PATHINFO_EXTENSION));
$allowed = ["jpg", "jpeg", "png", "webp"];
if (!in_array($extension, $allowed, true)) {
    json_response(["error" => "Only JPG, PNG, and WEBP images are allowed"], 422);
}

$uploadDir = dirname(__DIR__) . "/uploads/brilogs";
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$filename = "brilog-{$brilogId}-" . bin2hex(random_bytes(8)) . ".{$extension}";
$target = "{$uploadDir}/{$filename}";

if (!move_uploaded_file($file["tmp_name"], $target)) {
    json_response(["error" => "Image upload failed"], 500);
}

$url = brilog_image_url($filename);
$sortStatement = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM brilog_images WHERE brilog_id = ?");
$sortStatement->execute([$brilogId]);
$sortOrder = (int)$sortStatement->fetchColumn();

$statement = $pdo->prepare("INSERT INTO brilog_images (brilog_id, image_url, sort_order) VALUES (?, ?, ?)");
$statement->execute([$brilogId, $url, $sortOrder]);

json_response([
    "ok" => true,
    "image" => [
        "id" => (int)$pdo->lastInsertId(),
        "brilog_id" => $brilogId,
        "image_url" => $url,
        "sort_order" => $sortOrder,
    ],
]);
