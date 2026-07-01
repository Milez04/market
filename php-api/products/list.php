<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$statement = $pdo->query("SELECT id, title, description, price, COALESCE(NULLIF(front_image_url, ''), image_url, '') AS image_url, front_image_url, back_image_url, sort_order FROM products WHERE active = 1 ORDER BY sort_order ASC, id ASC");

json_response(["products" => $statement->fetchAll()]);
