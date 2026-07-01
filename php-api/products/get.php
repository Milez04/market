<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$id = (int)($_GET["id"] ?? 0);

if ($id <= 0) {
    json_response(["error" => "Product id is required"], 422);
}

$statement = $pdo->prepare("SELECT id, title, description, price, COALESCE(NULLIF(front_image_url, ''), image_url, '') AS image_url, front_image_url, back_image_url, sort_order FROM products WHERE id = ? AND active = 1");
$statement->execute([$id]);
$product = $statement->fetch();

if (!$product) {
    json_response(["error" => "Product not found"], 404);
}

json_response(["product" => $product]);
