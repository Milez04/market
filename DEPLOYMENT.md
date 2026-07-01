# CardForge 3D Deployment

Bu proje iki parçadan oluşur:

- **Next.js frontend**: React arayüzü.
- **PHP API + MySQL**: login, admin, ürünler, kataloglar, upload edilen görseller.

## 1. Hosting Seçimi

### En kolay doğru kurulum

Next.js için Node.js destekli hosting gerekir:

- VPS
- Render / Railway / DigitalOcean / Hetzner
- cPanel Node.js destekliyorsa cPanel Node App

PHP API için:

- Apache + PHP + MySQL
- cPanel hosting
- VPS üstünde Apache/Nginx + PHP-FPM + MySQL

> Sadece klasik PHP hosting varsa Next.js SSR çalışmaz. O durumda frontend için ayrıca Node destekli hosting gerekir.

## 2. Domain Örneği

Bu doküman şu yapıya göre anlatır:

```text
https://your-domain.com              -> Next.js frontend
https://your-domain.com/cardforge-api -> PHP API
```

İstersen API subdomain de olabilir:

```text
https://api.your-domain.com
```

O zaman `NEXT_PUBLIC_PHP_API_URL` değerini ona göre yaz.

## 3. MySQL Database

Hosting panelinde bir database oluştur:

```text
Database name: cardforge
User: cardforge_user
Password: strong_password
```

Sonra phpMyAdmin üzerinden şu dosyayı import et:

```text
php-api/schema.sql
```

## 4. PHP API Yükleme

Sunucuda public web klasörüne şu klasörü yükle:

```text
php-api
```

Sunucuda klasör adını şöyle yap:

```text
public_html/cardforge-api
```

Yüklenecek PHP klasörü içeriği:

```text
php-api/admin
php-api/auth
php-api/brilogs
php-api/catalogs
php-api/orders
php-api/products
php-api/projects
php-api/uploads
php-api/config.php
php-api/schema.sql
php-api/.env.php
```

`php-api/.env.example.php` dosyasını kopyala ve adını değiştir:

```text
php-api/.env.php
```

İçini kendi bilgilerinizle doldur:

```php
<?php
return [
    "db_host" => "localhost",
    "db_name" => "cardforge",
    "db_user" => "cardforge_user",
    "db_password" => "strong_password",
    "app_url" => "https://your-domain.com",
    "api_url" => "https://your-domain.com/cardforge-api",
];
```

`uploads` klasörünün yazılabilir olması gerekir:

```text
php-api/uploads/products
php-api/uploads/brilogs
php-api/uploads/catalogs
```

cPanel kullanıyorsan permissions genelde `755` veya gerekirse `775` yeterli olur.

## 5. Next.js Environment

Sunucuda veya deployment panelinde şu env değerlerini gir:

```env
NEXT_PUBLIC_SITE_DOMAIN=your-domain.com
NEXT_PUBLIC_PHP_API_URL=https://your-domain.com/cardforge-api
```

Varsa diğer servisler:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 6. Next.js Build

Sunucuda proje kökünde:

```bash
npm install
npm run build
npm run start
```

Production server port örneği:

```bash
npm run start -- -p 3000
```

VPS kullanıyorsan PM2 önerilir:

```bash
npm install -g pm2
pm2 start npm --name cardforge -- start
pm2 save
```

## 7. Next.js İçin Yüklenecek Dosyalar

Node destekli sunucuya şunları yükle:

```text
src
public
package.json
package-lock.json
next.config.ts
tsconfig.json
postcss.config.mjs
eslint.config.mjs
next-env.d.ts
.env.production
```

Yüklemene gerek olmayanlar:

```text
node_modules
.next
dev-*.log
*.png verify/test ekran görüntüleri
```

Sunucuda `npm install` ve `npm run build` çalıştırınca `node_modules` ve `.next` oluşur.

## 8. cPanel Node.js App İçin

cPanel'de Node.js App oluştur:

```text
Application root: cardforge
Application startup file: node_modules/next/dist/bin/next
Application mode: production
```

Environment:

```text
NEXT_PUBLIC_SITE_DOMAIN=your-domain.com
NEXT_PUBLIC_PHP_API_URL=https://your-domain.com/cardforge-api
```

Terminal:

```bash
cd cardforge
npm install
npm run build
```

Start command destekliyorsa:

```bash
npm run start
```

## 9. Test URL'leri

PHP API test:

```text
https://your-domain.com/cardforge-api/products/list.php
https://your-domain.com/cardforge-api/brilogs/list.php
https://your-domain.com/cardforge-api/catalogs/list.php
```

Frontend test:

```text
https://your-domain.com
https://your-domain.com/admin
```

Varsayılan admin:

```text
Email: admin@cardforge.local
Password: admin12345
```

Canlıya geçince admin şifresini değiştirmen gerekir.

## 10. Önemli Notlar

- PHP API URL yanlışsa login ve ürünler çalışmaz.
- Upload edilen görseller `php-api/uploads` içinde kalır.
- Hosting değiştirirken `uploads` klasörünü ve MySQL dump'ını beraber taşı.
- Domain HTTPS olmalı. WhatsApp yönlendirmeleri HTTPS altında daha sorunsuz çalışır.
- `NEXT_PUBLIC_PHP_API_URL` build sırasında okunur; değiştirirsen tekrar `npm run build` yap.
