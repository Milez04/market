<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$slug = trim((string)($_GET["slug"] ?? ""));

if ($slug === "") {
    json_response(["error" => "Catalog slug is required"], 422);
}

$statement = $pdo->prepare("SELECT id, slug, title, description, sort_order FROM product_catalogs WHERE slug = ? AND active = 1");
$statement->execute([$slug]);
$catalog = $statement->fetch();
if (!$catalog) {
    json_response(["error" => "Catalog not found"], 404);
}

$productStatement = $pdo->prepare("SELECT id, catalog_id, title, description, price, sort_order FROM catalog_products WHERE catalog_id = ? AND active = 1 ORDER BY sort_order ASC, id ASC");
$productStatement->execute([(int)$catalog["id"]]);
$products = $productStatement->fetchAll();

if (count($products) > 0) {
    $ids = array_map(fn($item) => (int)$item["id"], $products);
    $placeholders = implode(",", array_fill(0, count($ids), "?"));
    $imageStatement = $pdo->prepare("SELECT id, product_id, image_url, sort_order FROM catalog_product_images WHERE product_id IN ({$placeholders}) ORDER BY sort_order ASC, id ASC");
    $imageStatement->execute($ids);
    $imagesByProduct = [];
    foreach ($imageStatement->fetchAll() as $image) {
        $imagesByProduct[(int)$image["product_id"]][] = $image;
    }
    foreach ($products as &$product) {
        $product["images"] = $imagesByProduct[(int)$product["id"]] ?? [];
        $product["image_url"] = $product["images"][0]["image_url"] ?? "";
    }
    unset($product);
}

$catalog["products"] = $products;
json_response(["catalog" => $catalog]);
