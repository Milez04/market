<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$data = input();
$name = trim((string)($data["name"] ?? ""));
$email = strtolower(trim((string)($data["email"] ?? "")));
$password = (string)($data["password"] ?? "");

if ($name === "" || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    json_response(["error" => "Name, valid email, and 6+ character password are required"], 422);
}

$token = bin2hex(random_bytes(32));

try {
    $statement = $pdo->prepare("INSERT INTO users (name, email, password_hash, api_token) VALUES (?, ?, ?, ?)");
    $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $token]);
    json_response([
        "user" => ["id" => (int)$pdo->lastInsertId(), "name" => $name, "email" => $email],
        "token" => $token,
    ]);
} catch (PDOException $error) {
    json_response(["error" => "This email is already registered"], 409);
}
