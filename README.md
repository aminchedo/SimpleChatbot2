# Simple Chatbot

یک چت‌بات ساده با استفاده از Node.js، Express، و Socket.io که قابلیت پردازش پیام‌های متنی و تصاویر را دارد.

## ویژگی‌ها

- چت real-time با Socket.io
- پردازش پیام‌های متنی و تصاویر
- رابط کاربری مدرن و responsive
- پشتیبانی از Docker
- CI/CD با GitLab
- قابلیت deployment خودکار

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js (نسخه 18 یا بالاتر)
- Docker و Docker Compose
- Git

### راه‌اندازی محلی

1. کلون کردن پروژه:
```bash
git clone <repository-url>
cd SimpleChatbot2
```

2. نصب dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. تنظیم متغیرهای محیطی:
```bash
cp .env.example .env
# ویرایش فایل .env با تنظیمات مورد نیاز
```

4. اجرای پروژه:
```bash
# با Docker Compose
docker-compose up -d

# یا به صورت جداگانه
cd backend && npm start
cd frontend && npm start
```

## GitLab CI/CD

این پروژه از GitLab CI/CD برای اتوماسیون فرآیند build، test و deployment استفاده می‌کند.

### Pipeline Stages

1. **Test**: اجرای تست‌های unit
2. **Build**: ساخت Docker images
3. **Deploy**: استقرار در محیط‌های staging و production

### متغیرهای محیطی مورد نیاز در GitLab

در تنظیمات GitLab CI/CD Variables، متغیرهای زیر را تعریف کنید:

#### Docker Registry
- `CI_REGISTRY_USER`: نام کاربری registry
- `CI_REGISTRY_PASSWORD`: رمز عبور registry

#### SSH و Server Configuration
- `SSH_PRIVATE_KEY`: کلید خصوصی SSH برای اتصال به سرور
- `STAGING_SERVER`: آدرس IP یا دامنه سرور staging
- `STAGING_USER`: نام کاربری سرور staging
- `STAGING_PATH`: مسیر پروژه در سرور staging
- `STAGING_URL`: URL محیط staging
- `PRODUCTION_SERVER`: آدرس IP یا دامنه سرور production
- `PRODUCTION_USER`: نام کاربری سرور production
- `PRODUCTION_PATH`: مسیر پروژه در سرور production
- `PRODUCTION_URL`: URL محیط production

### راه‌اندازی GitLab Repository

1. ایجاد repository جدید در GitLab
2. اضافه کردن GitLab remote:
```bash
git remote add gitlab <gitlab-repository-url>
```

3. Push کردن کد:
```bash
git push gitlab main
```

## Docker

### Build کردن Images

```bash
# Build همه services
docker-compose build

# Build یک service خاص
docker-compose build backend
```

### اجرای در محیط Production

```bash
docker-compose -f docker-compose.production.yml up -d
```

## مستندات API

API endpoints در فایل `backend/routes/` تعریف شده‌اند.

### WebSocket Events

- `message`: ارسال پیام جدید
- `image`: ارسال تصویر
- `user_connected`: اتصال کاربر جدید
- `user_disconnected`: قطع اتصال کاربر

## ساختار پروژه

```
SimpleChatbot2/
├── backend/              # Backend Node.js
├── frontend/             # Frontend static files
├── nginx/                # Nginx configuration
├── docker-compose.yml    # Development environment
├── docker-compose.production.yml  # Production environment
├── .gitlab-ci.yml        # GitLab CI/CD pipeline
└── README.md
```

## مشارکت

1. Fork کردن پروژه
2. ایجاد feature branch (`git checkout -b feature/amazing-feature`)
3. Commit کردن تغییرات (`git commit -m 'Add amazing feature'`)
4. Push کردن به branch (`git push origin feature/amazing-feature`)
5. ایجاد Pull Request

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## پشتیبانی

برای گزارش باگ یا درخواست ویژگی جدید، از GitLab Issues استفاده کنید.