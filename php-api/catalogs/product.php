<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$id = (int)($_GET["id"] ?? 0);

if ($id <= 0) {
    json_response(["error" => "Product id is required"], 422);
}

$statement = $pdo->prepare(
    "SELECT catalog_products.id, catalog_products.catalog_id, catalog_products.title, catalog_products.description, catalog_products.price,
            product_catalogs.slug AS catalog_slug, product_catalogs.title AS catalog_title
     FROM catalog_products
     INNER JOIN product_catalogs ON product_catalogs.id = catalog_products.catalog_id
     WHERE catalog_products.id = ? AND catalog_products.active = 1 AND product_catalogs.active = 1",
);
$statement->execute([$id]);
$product = $statement->fetch();
if (!$product) {
    json_response(["error" => "Product not found"], 404);
}

$imageStatement = $pdo->prepare("SELECT id, product_id, image_url, sort_order FROM catalog_product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC");
$imageStatement->execute([$id]);
$product["images"] = $imageStatement->fetchAll();
$product["image_url"] = $product["images"][0]["image_url"] ?? "";

json_response(["product" => $product]);
