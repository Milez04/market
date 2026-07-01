<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
current_admin($pdo);

function product_upload_path_from_url(string $url): string
{
    $path = (string)(parse_url($url, PHP_URL_PATH) ?? "");
    if ($path === "" || !str_contains($path, "/uploads/products/")) {
        return "";
    }

    $filename = basename($path);
    if ($filename === "" || $filename === "." || $filename === "..") {
        return "";
    }

    return dirname(__DIR__) . "/uploads/products/" . $filename;
}

function delete_product_upload(string $url): void
{
    $path = product_upload_path_from_url($url);
    if ($path !== "" && is_file($path)) {
        unlink($path);
    }
}

function public_product_upload_url(string $filename): string
{
    $https = !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off";
    $scheme = $https ? "https" : "http";
    $host = $_SERVER["HTTP_HOST"] ?? "localhost";
    $script = str_replace("\\", "/", $_SERVER["SCRIPT_NAME"] ?? "");
    $apiBase = dirname(dirname($script));
    return "{$scheme}://{$host}{$apiBase}/uploads/products/{$filename}";
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(["error" => "Method not allowed"], 405);
}

$productId = (int)($_POST["product_id"] ?? 0);
$side = (string)($_POST["side"] ?? "front");
if ($productId <= 0) {
    json_response(["error" => "Product id is required"], 422);
}

if (!in_array($side, ["front", "back"], true)) {
    json_response(["error" => "Image side must be front or back"], 422);
}

if (empty($_FILES["image"]) || !is_uploaded_file($_FILES["image"]["tmp_name"])) {
    json_response(["error" => "Image file is required"], 422);
}

$file = $_FILES["image"];
if (($file["error"] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
    json_response(["error" => "Upload failed"], 422);
}

if ((int)$file["size"] > 8 * 1024 * 1024) {
    json_response(["error" => "Image must be smaller than 8MB"], 422);
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file["tmp_name"]);
$extensions = [
    "image/png" => "png",
    "image/jpeg" => "jpg",
    "image/webp" => "webp",
];

if (!isset($extensions[$mime])) {
    json_response(["error" => "Only PNG, JPG, and WEBP images are allowed"], 422);
}

$productStatement = $pdo->prepare("SELECT id, image_url, front_image_url, back_image_url FROM products WHERE id = ?");
$productStatement->execute([$productId]);
$product = $productStatement->fetch();

if (!$product) {
    json_response(["error" => "Product not found"], 404);
}

$uploadDir = dirname(__DIR__) . "/uploads/products";
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$filename = "product-" . $productId . "-" . bin2hex(random_bytes(8)) . "." . $extensions[$mime];
$target = $uploadDir . "/" . $filename;

if (!move_uploaded_file($file["tmp_name"], $target)) {
    json_response(["error" => "Image could not be saved"], 500);
}

$imageUrl = public_product_upload_url($filename);
$field = $side === "back" ? "back_image_url" : "front_image_url";
if ($side === "front") {
    $statement = $pdo->prepare("UPDATE products SET front_image_url = ?, image_url = ? WHERE id = ?");
    $statement->execute([$imageUrl, $imageUrl, $productId]);
} else {
    $statement = $pdo->prepare("UPDATE products SET back_image_url = ? WHERE id = ?");
    $statement->execute([$imageUrl, $productId]);
}

$oldUrl = (string)($product[$field] ?? "");
if ($oldUrl !== "") {
    delete_product_upload($oldUrl);
}

json_response(["image_url" => $imageUrl, "side" => $side]);
