# راهنمای راه‌اندازی GitLab

این راهنما شامل تمام مراحل لازم برای راه‌اندازی پروژه در GitLab است.

## مرحله 1: ایجاد Repository در GitLab

1. وارد GitLab شوید
2. روی "New Project" کلیک کنید
3. "Create blank project" را انتخاب کنید
4. نام پروژه را وارد کنید (مثال: SimpleChatbot2)
5. سطح دسترسی را تنظیم کنید (Private/Public)
6. "Create project" را کلیک کنید

## مرحله 2: اضافه کردن Remote و Push کردن کد

```bash
# اضافه کردن GitLab remote
git remote add gitlab https://gitlab.com/username/SimpleChatbot2.git

# یا اگر از SSH استفاده می‌کنید:
git remote add gitlab git@gitlab.com:username/SimpleChatbot2.git

# Push کردن کد
git push gitlab main
```

## مرحله 3: تنظیم CI/CD Variables

در GitLab، به مسیر زیر بروید:
`Project Settings > CI/CD > Variables`

### متغیرهای ضروری:

#### Docker Registry
- **Key**: `CI_REGISTRY_USER`
  - **Value**: `gitlab-ci-token`
  - **Type**: Variable
  - **Masked**: Yes

- **Key**: `CI_REGISTRY_PASSWORD`
  - **Value**: Personal Access Token یا Deploy Token
  - **Type**: Variable
  - **Masked**: Yes

#### SSH Configuration
- **Key**: `SSH_PRIVATE_KEY`
  - **Value**: محتوای فایل SSH private key
  - **Type**: Variable
  - **Masked**: No

#### Staging Environment
- **Key**: `STAGING_SERVER`
  - **Value**: `staging.example.com`
  - **Type**: Variable

- **Key**: `STAGING_USER`
  - **Value**: `deploy`
  - **Type**: Variable

- **Key**: `STAGING_PATH`
  - **Value**: `/var/www/staging`
  - **Type**: Variable

- **Key**: `STAGING_URL`
  - **Value**: `https://staging.example.com`
  - **Type**: Variable

#### Production Environment
- **Key**: `PRODUCTION_SERVER`
  - **Value**: `production.example.com`
  - **Type**: Variable

- **Key**: `PRODUCTION_USER`
  - **Value**: `deploy`
  - **Type**: Variable

- **Key**: `PRODUCTION_PATH`
  - **Value**: `/var/www/production`
  - **Type**: Variable

- **Key**: `PRODUCTION_URL`
  - **Value**: `https://production.example.com`
  - **Type**: Variable

## مرحله 4: تنظیم SSH Keys

### ایجاد SSH Key جدید:
```bash
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@yourdomain.com"
```

### اضافه کردن Public Key به سرور:
```bash
# کپی کردن public key
cat ~/.ssh/id_rsa.pub

# اضافه کردن به authorized_keys در سرور
echo "your-public-key" >> ~/.ssh/authorized_keys
```

### اضافه کردن Private Key به GitLab:
محتوای فایل `~/.ssh/id_rsa` را در متغیر `SSH_PRIVATE_KEY` قرار دهید.

## مرحله 5: تنظیم Docker Registry

### GitLab Container Registry:
GitLab به طور خودکار Container Registry فراهم می‌کند. آدرس آن:
```
registry.gitlab.com/username/project-name
```

### استفاده از Registry خارجی (اختیاری):
اگر از Docker Hub یا registry دیگری استفاده می‌کنید، متغیرهای زیر را تنظیم کنید:
- `CI_REGISTRY`: آدرس registry
- `CI_REGISTRY_USER`: نام کاربری
- `CI_REGISTRY_PASSWORD`: رمز عبور

## مرحله 6: تنظیم سرورهای Staging و Production

### نصب Docker در سرور:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# نصب Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### ایجاد دایرکتوری پروژه:
```bash
# Staging
sudo mkdir -p /var/www/staging
sudo chown deploy:deploy /var/www/staging

# Production
sudo mkdir -p /var/www/production
sudo chown deploy:deploy /var/www/production
```

### کپی کردن فایل‌های Docker Compose:
```bash
# کپی فایل‌های docker-compose به سرور
scp docker-compose.yml deploy@staging-server:/var/www/staging/
scp docker-compose.production.yml deploy@production-server:/var/www/production/
```

## مرحله 7: تست Pipeline

1. یک commit جدید ایجاد کنید:
```bash
git add .
git commit -m "Add GitLab CI/CD configuration"
git push gitlab main
```

2. در GitLab به `CI/CD > Pipelines` بروید
3. وضعیت pipeline را بررسی کنید

## مرحله 8: تنظیمات امنیتی

### Firewall Configuration:
```bash
# اجازه دسترسی به پورت‌های مورد نیاز
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### SSL Certificate:
```bash
# استفاده از Let's Encrypt
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

## عیب‌یابی

### مشکلات رایج:

1. **SSH Connection Failed**:
   - بررسی صحت SSH private key
   - اطمینان از دسترسی user به سرور

2. **Docker Build Failed**:
   - بررسی Dockerfile
   - اطمینان از وجود تمام dependencies

3. **Registry Push Failed**:
   - بررسی credentials
   - اطمینان از دسترسی به registry

4. **Deployment Failed**:
   - بررسی مسیر پروژه در سرور
   - اطمینان از نصب Docker در سرور

### لاگ‌ها:
```bash
# مشاهده لاگ‌های container
docker-compose logs -f

# مشاهده وضعیت services
docker-compose ps
```

## نکات مهم

1. همیشه از environment variables برای اطلاعات حساس استفاده کنید
2. فایل‌های `.env` را در `.gitignore` قرار دهید
3. از strong passwords برای database ها استفاده کنید
4. به طور منظم backup از داده‌ها تهیه کنید
5. pipeline را قبل از production تست کنید

## پشتیبانی

برای کمک بیشتر:
- مستندات GitLab CI/CD
- GitLab Community Forum
- Docker Documentation