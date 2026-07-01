<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

function app_config(): array
{
    $file = __DIR__ . "/.env.php";
    $fileConfig = is_file($file) ? require $file : [];
    if (!is_array($fileConfig)) {
        $fileConfig = [];
    }

    return array_merge([
        "db_host" => getenv("CARDFORGE_DB_HOST") ?: "127.0.0.1",
        "db_name" => getenv("CARDFORGE_DB_NAME") ?: "cardforge",
        "db_user" => getenv("CARDFORGE_DB_USER") ?: "root",
        "db_password" => getenv("CARDFORGE_DB_PASSWORD") ?: "",
        "app_url" => getenv("CARDFORGE_APP_URL") ?: "",
        "api_url" => getenv("CARDFORGE_API_URL") ?: "",
    ], $fileConfig);
}

function db(): PDO
{
    $config = app_config();
    $host = (string)$config["db_host"];
    $database = (string)$config["db_name"];
    $user = (string)$config["db_user"];
    $password = (string)$config["db_password"];

    return new PDO(
        "mysql:host={$host};dbname={$database};charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ],
    );
}

function input(): array
{
    $raw = file_get_contents("php://input") ?: "{}";
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function bearer_token(): string
{
    $header = $_SERVER["HTTP_AUTHORIZATION"]
        ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"]
        ?? "";

    if ($header === "" && function_exists("getallheaders")) {
        $headers = getallheaders();
        $header = $headers["Authorization"] ?? $headers["authorization"] ?? "";
    }

    if (preg_match('/Bearer\s+(.+)/', $header, $matches)) {
        return trim($matches[1]);
    }
    return "";
}

function current_user(PDO $pdo): array
{
    $token = bearer_token();
    if ($token === "") {
        json_response(["error" => "Unauthorized"], 401);
    }

    $statement = $pdo->prepare("SELECT id, name, email FROM users WHERE api_token = ?");
    $statement->execute([$token]);
    $user = $statement->fetch();

    if (!$user) {
        json_response(["error" => "Unauthorized"], 401);
    }

    return $user;
}

function current_admin(PDO $pdo): array
{
    $token = bearer_token();
    if ($token === "") {
        json_response(["error" => "Unauthorized"], 401);
    }

    $statement = $pdo->prepare(
        "SELECT admins.id, admins.email
         FROM admin_sessions
         INNER JOIN admins ON admins.id = admin_sessions.admin_id
         WHERE admin_sessions.token = ?",
    );
    $statement->execute([$token]);
    $admin = $statement->fetch();

    if (!$admin) {
        json_response(["error" => "Unauthorized"], 401);
    }

    return $admin;
}
