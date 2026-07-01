<?php
require_once __DIR__ . "/../config.php";

$pdo = db();
$data = input();
$email = strtolower(trim((string)($data["email"] ?? "")));
$password = (string)($data["password"] ?? "");

$seedEmail = "admin@cardforge.local";
$seedPassword = "admin12345";

$count = (int)$pdo->query("SELECT COUNT(*) FROM admins")->fetchColumn();
if ($count === 0) {
    $statement = $pdo->prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)");
    $statement->execute([$seedEmail, password_hash($seedPassword, PASSWORD_DEFAULT)]);
}

$statement = $pdo->prepare("SELECT id, email, password_hash FROM admins WHERE email = ?");
$statement->execute([$email]);
$admin = $statement->fetch();

if (!$admin || !password_verify($password, $admin["password_hash"])) {
    json_response(["error" => "Invalid admin credentials"], 401);
}

$token = bin2hex(random_bytes(32));
$session = $pdo->prepare("INSERT INTO admin_sessions (admin_id, token) VALUES (?, ?)");
$session->execute([$admin["id"], $token]);

json_response([
    "admin" => ["id" => (int)$admin["id"], "email" => $admin["email"]],
    "token" => $token,
]);
