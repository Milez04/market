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

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $statement = $pdo->query("SELECT id, title, description, price, COALESCE(NULLIF(front_image_url, ''), image_url, '') AS image_url, front_image_url, back_image_url, sort_order, active FROM products ORDER BY sort_order ASC, id ASC");
    json_response(["products" => $statement->fetchAll()]);
}

$data = input();
$id = (int)($data["id"] ?? 0);

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    if ($id <= 0) {
        json_response(["error" => "Product id is required"], 422);
    }
    $oldStatement = $pdo->prepare("SELECT image_url, front_image_url, back_image_url FROM products WHERE id = ?");
    $oldStatement->execute([$id]);
    $oldProduct = $oldStatement->fetch();
    $statement = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $statement->execute([$id]);
    if ($oldProduct) {
        foreach (["image_url", "front_image_url", "back_image_url"] as $field) {
            if (!empty($oldProduct[$field])) delete_product_upload((string)$oldProduct[$field]);
        }
    }
    json_response(["ok" => true]);
}

$title = trim((string)($data["title"] ?? ""));
$description = trim((string)($data["description"] ?? ""));
$price = (int)($data["price"] ?? 0);
$imageUrl = trim((string)($data["image_url"] ?? ""));
$frontImageUrl = trim((string)($data["front_image_url"] ?? $imageUrl));
$backImageUrl = trim((string)($data["back_image_url"] ?? ""));
$active = !empty($data["active"]) ? 1 : 0;

if ($title === "" || $description === "" || $price <= 0) {
    json_response(["error" => "Product title, description, and price are required"], 422);
}

if ($id > 0) {
    $oldStatement = $pdo->prepare("SELECT image_url, front_image_url, back_image_url FROM products WHERE id = ?");
    $oldStatement->execute([$id]);
    $oldProduct = $oldStatement->fetch();
    $statement = $pdo->prepare("UPDATE products SET title = ?, description = ?, price = ?, image_url = ?, front_image_url = ?, back_image_url = ?, active = ? WHERE id = ?");
    $statement->execute([$title, $description, $price, $frontImageUrl, $frontImageUrl, $backImageUrl, $active, $id]);
    if ($oldProduct) {
        $nextUrls = [$frontImageUrl, $backImageUrl];
        foreach (["image_url", "front_image_url", "back_image_url"] as $field) {
            $oldUrl = (string)($oldProduct[$field] ?? "");
            if ($oldUrl !== "" && !in_array($oldUrl, $nextUrls, true)) delete_product_upload($oldUrl);
        }
    }
    json_response(["ok" => true, "product" => ["id" => $id]]);
}

$sortOrder = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM products")->fetchColumn();
$statement = $pdo->prepare("INSERT INTO products (title, description, price, image_url, front_image_url, back_image_url, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$statement->execute([$title, $description, $price, $frontImageUrl, $frontImageUrl, $backImageUrl, $sortOrder, $active]);

json_response(["ok" => true, "product" => ["id" => (int)$pdo->lastInsertId()]]);
