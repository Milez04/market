<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
current_admin($pdo);

function catalog_image_url(string $filename): string
{
    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host = $_SERVER["HTTP_HOST"] ?? "localhost";
    $scriptDir = str_replace("\\", "/", dirname($_SERVER["SCRIPT_NAME"] ?? ""));
    $apiBase = preg_replace("#/admin$#", "", $scriptDir);
    return "{$scheme}://{$host}{$apiBase}/uploads/catalogs/{$filename}";
}

function catalog_image_path_from_url(string $url): string
{
    $path = (string)(parse_url($url, PHP_URL_PATH) ?? "");
    if ($path === "" || !str_contains($path, "/uploads/catalogs/")) return "";
    $filename = basename($path);
    if ($filename === "" || $filename === "." || $filename === "..") return "";
    return dirname(__DIR__) . "/uploads/catalogs/" . $filename;
}

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    $data = input();
    $id = (int)($data["id"] ?? 0);
    if ($id <= 0) json_response(["error" => "Image id is required"], 422);
    $statement = $pdo->prepare("SELECT image_url FROM catalog_product_images WHERE id = ?");
    $statement->execute([$id]);
    $image = $statement->fetch();
    if (!$image) json_response(["error" => "Image not found"], 404);
    $delete = $pdo->prepare("DELETE FROM catalog_product_images WHERE id = ?");
    $delete->execute([$id]);
    $path = catalog_image_path_from_url((string)$image["image_url"]);
    if ($path !== "" && is_file($path)) unlink($path);
    json_response(["ok" => true]);
}

$productId = (int)($_POST["product_id"] ?? 0);
if ($productId <= 0) json_response(["error" => "Product id is required"], 422);

$countStatement = $pdo->prepare("SELECT COUNT(*) FROM catalog_product_images WHERE product_id = ?");
$countStatement->execute([$productId]);
if ((int)$countStatement->fetchColumn() >= 10) {
    json_response(["error" => "Maximum 10 photos are allowed"], 422);
}

if (empty($_FILES["image"]) || !is_uploaded_file($_FILES["image"]["tmp_name"])) {
    json_response(["error" => "Image file is required"], 422);
}

$file = $_FILES["image"];
$extension = strtolower(pathinfo((string)$file["name"], PATHINFO_EXTENSION));
if (!in_array($extension, ["jpg", "jpeg", "png", "webp"], true)) {
    json_response(["error" => "Only JPG, PNG, and WEBP images are allowed"], 422);
}

$uploadDir = dirname(__DIR__) . "/uploads/catalogs";
if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);

$filename = "catalog-{$productId}-" . bin2hex(random_bytes(8)) . ".{$extension}";
$target = "{$uploadDir}/{$filename}";
if (!move_uploaded_file($file["tmp_name"], $target)) {
    json_response(["error" => "Image upload failed"], 500);
}

$url = catalog_image_url($filename);
$sortStatement = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM catalog_product_images WHERE product_id = ?");
$sortStatement->execute([$productId]);
$sortOrder = (int)$sortStatement->fetchColumn();
$statement = $pdo->prepare("INSERT INTO catalog_product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)");
$statement->execute([$productId, $url, $sortOrder]);
json_response(["ok" => true, "image" => ["id" => (int)$pdo->lastInsertId(), "product_id" => $productId, "image_url" => $url, "sort_order" => $sortOrder]]);
