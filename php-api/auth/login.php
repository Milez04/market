<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$data = input();
$email = strtolower(trim((string)($data["email"] ?? "")));
$password = (string)($data["password"] ?? "");

$statement = $pdo->prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?");
$statement->execute([$email]);
$user = $statement->fetch();

if (!$user || !password_verify($password, $user["password_hash"])) {
    json_response(["error" => "Invalid email or password"], 401);
}

$token = bin2hex(random_bytes(32));
$update = $pdo->prepare("UPDATE users SET api_token = ? WHERE id = ?");
$update->execute([$token, $user["id"]]);

json_response([
    "user" => ["id" => (int)$user["id"], "name" => $user["name"], "email" => $user["email"]],
    "token" => $token,
]);
