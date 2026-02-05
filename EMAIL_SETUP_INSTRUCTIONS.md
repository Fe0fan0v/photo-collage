# Инструкция по настройке почты для отправки коллажей

## Вариант 1: EmailJS (Рекомендуется для быстрой настройки)

EmailJS позволяет отправлять email прямо из браузера без собственного бэкенда.

### Шаги настройки:

1. **Регистрация на EmailJS**
   - Перейдите на https://www.emailjs.com/
   - Нажмите "Sign Up" и создайте бесплатный аккаунт
   - Бесплатный тариф позволяет отправлять до 200 писем в месяц

2. **Подключение email-сервиса**
   - После регистрации перейдите в раздел "Email Services"
   - Нажмите "Add New Service"
   - Выберите ваш email-провайдер (Gmail, Outlook, Yahoo и т.д.)
   - Следуйте инструкциям для авторизации
   - **Сохраните Service ID** (например: "service_abc123")

3. **Создание шаблона письма**
   - Перейдите в раздел "Email Templates"
   - Нажмите "Create New Template"
   - Настройте шаблон:
     ```
     Тема письма: Ваш Seletti Russian Hybrid готов!

     Тело письма:
     Здравствуйте!

     Ваш персональный Seletti Russian Hybrid готов!
     Тарелка из новой коллекции во вложении в хорошем качестве.

     Тип клиента: {{customer_type}}

     С уважением,
     Команда Seletti
     ```
   - В настройках вложений включите возможность отправки файлов
   - **Сохраните Template ID** (например: "template_xyz789")

4. **Получение Public Key**
   - Перейдите в раздел "Account" → "General"
   - Найдите "Public Key" (или "API Keys")
   - **Скопируйте Public Key** (например: "user_1234567890")

### Что нужно предоставить разработчику:

Отправьте следующие 3 параметра:

```
Service ID: service_abc123
Template ID: template_xyz789
Public Key: user_1234567890
```

---

## Вариант 2: SMTP (Для продакшена с высокой нагрузкой)

Если ожидается большое количество отправок (более 200 в месяц), лучше использовать SMTP.

### Рекомендуемые провайдеры:

1. **SendGrid** (до 100 писем/день бесплатно)
   - https://sendgrid.com/

2. **Mailgun** (до 5000 писем/месяц бесплатно)
   - https://www.mailgun.com/

3. **Amazon SES** (дешево для больших объемов)
   - https://aws.amazon.com/ses/

### Что нужно предоставить разработчику:

```
SMTP Host: smtp.sendgrid.net (или другой)
SMTP Port: 587
SMTP Username: apikey (или ваш username)
SMTP Password: ваш_smtp_пароль
Отправитель (From): noreply@seletti.ru
```

---

## Вариант 3: Корпоративная почта (Mail.ru, Yandex, Gmail)

Можно использовать обычную корпоративную почту, но это не рекомендуется для массовых рассылок.

### Настройка для Gmail:

1. Включите двухфакторную аутентификацию
2. Создайте "App Password" в настройках Google Account
3. Используйте эти данные:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: app_password (16 символов)
```

### Настройка для Yandex:

```
SMTP Host: smtp.yandex.ru
SMTP Port: 587
SMTP Username: your-email@yandex.ru
SMTP Password: ваш_пароль
```

### Настройка для Mail.ru:

```
SMTP Host: smtp.mail.ru
SMTP Port: 587
SMTP Username: your-email@mail.ru
SMTP Password: ваш_пароль
```

---

## Рекомендация

Для быстрого старта используйте **Вариант 1 (EmailJS)** - настройка займет 10 минут и не требует программирования.

Если нужна надежность и большие объемы - используйте **Вариант 2 (SMTP)**.

---

## Дополнительная настройка Google Sheets (опционально)

Если нужно сохранять все email в Google таблицу для аналитики:

1. Создайте новую Google Таблицу
2. Перейдите в Extensions → Apps Script
3. Создайте Web App для приема данных
4. Предоставьте разработчику:
   - Web App URL
   - API Key (если используется)

Подробная инструкция: https://developers.google.com/apps-script/guides/web
