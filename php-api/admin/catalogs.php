<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
current_admin($pdo);

function make_slug(string $value): string
{
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?: "catalog";
    return trim($slug, "-") ?: "catalog";
}

function load_catalogs(PDO $pdo): array
{
    $catalogs = $pdo->query("SELECT id, slug, title, description, sort_order, active FROM product_catalogs ORDER BY sort_order ASC, id ASC")->fetchAll();
    foreach ($catalogs as &$catalog) {
        $productStatement = $pdo->prepare("SELECT id, catalog_id, title, description, price, sort_order, active FROM catalog_products WHERE catalog_id = ? ORDER BY sort_order ASC, id ASC");
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
    }
    unset($catalog);
    return $catalogs;
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    json_response(["catalogs" => load_catalogs($pdo)]);
}

$data = input();
$action = (string)($data["action"] ?? "catalog");

if ($action === "reorder") {
    $ids = $data["ids"] ?? [];
    if (!is_array($ids)) {
        json_response(["error" => "Catalog ids are required"], 422);
    }
    $statement = $pdo->prepare("UPDATE product_catalogs SET sort_order = ? WHERE id = ?");
    foreach (array_values($ids) as $index => $catalogId) {
        $statement->execute([$index + 1, (int)$catalogId]);
    }
    json_response(["ok" => true]);
}

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    $id = (int)($data["id"] ?? 0);
    if ($id <= 0) json_response(["error" => "Id is required"], 422);
    if ($action === "product") {
        $statement = $pdo->prepare("DELETE FROM catalog_products WHERE id = ?");
        $statement->execute([$id]);
    } else {
        $statement = $pdo->prepare("DELETE FROM product_catalogs WHERE id = ?");
        $statement->execute([$id]);
    }
    json_response(["ok" => true]);
}

if ($action === "product") {
    $id = (int)($data["id"] ?? 0);
    $catalogId = (int)($data["catalog_id"] ?? 0);
    $title = trim((string)($data["title"] ?? ""));
    $description = trim((string)($data["description"] ?? ""));
    $price = (int)($data["price"] ?? 0);
    $active = !empty($data["active"]) ? 1 : 0;
    if ($catalogId <= 0 || $title === "" || $description === "" || $price <= 0) {
        json_response(["error" => "Catalog, title, description, and price are required"], 422);
    }
    if ($id > 0) {
        $statement = $pdo->prepare("UPDATE catalog_products SET title = ?, description = ?, price = ?, active = ? WHERE id = ?");
        $statement->execute([$title, $description, $price, $active, $id]);
        json_response(["ok" => true, "product" => ["id" => $id]]);
    }
    $sortStatement = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM catalog_products WHERE catalog_id = ?");
    $sortStatement->execute([$catalogId]);
    $sortOrder = (int)$sortStatement->fetchColumn();
    $statement = $pdo->prepare("INSERT INTO catalog_products (catalog_id, title, description, price, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)");
    $statement->execute([$catalogId, $title, $description, $price, $sortOrder, $active]);
    json_response(["ok" => true, "product" => ["id" => (int)$pdo->lastInsertId()]]);
}

$id = (int)($data["id"] ?? 0);
$title = trim((string)($data["title"] ?? ""));
$description = trim((string)($data["description"] ?? ""));
$slug = make_slug((string)($data["slug"] ?? $title));
$active = !empty($data["active"]) ? 1 : 0;
if ($title === "" || $description === "") {
    json_response(["error" => "Catalog title and description are required"], 422);
}
if ($id > 0) {
    $statement = $pdo->prepare("UPDATE product_catalogs SET slug = ?, title = ?, description = ?, active = ? WHERE id = ?");
    $statement->execute([$slug, $title, $description, $active, $id]);
    json_response(["ok" => true, "catalog" => ["id" => $id]]);
}
$sortOrder = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM product_catalogs")->fetchColumn();
$statement = $pdo->prepare("INSERT INTO product_catalogs (slug, title, description, sort_order, active) VALUES (?, ?, ?, ?, ?)");
$statement->execute([$slug, $title, $description, $sortOrder, $active]);
json_response(["ok" => true, "catalog" => ["id" => (int)$pdo->lastInsertId()]]);
