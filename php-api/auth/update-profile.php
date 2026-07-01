<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$user = current_user($pdo);
$data = input();
$name = trim((string)($data["name"] ?? ""));

if ($name === "") {
    json_response(["error" => "Name is required"], 422);
}

$statement = $pdo->prepare("UPDATE users SET name = ? WHERE id = ?");
$statement->execute([$name, $user["id"]]);

json_response(["user" => ["id" => (int)$user["id"], "name" => $name, "email" => $user["email"]]]);
