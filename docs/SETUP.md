# Настройка сервисов для «Портрет на тарелке»

## Содержание
1. [Настройка изображений тарелок](#настройка-изображений-тарелок)
2. [Настройка EmailJS](#настройка-emailjs)
3. [Настройка Google Sheets](#настройка-google-sheets)
4. [Переменные окружения](#переменные-окружения)
5. [Деплой](#деплой)

---

## Настройка изображений тарелок

Приложение использует 3 изображения тарелок для выбора. Замените файлы в папке `src/assets/`:

- `plate-1.jpg` — первый дизайн тарелки
- `plate-2.jpg` — второй дизайн тарелки
- `plate-3.jpg` — третий дизайн тарелки

**Требования к изображениям:**
- Формат: JPG или PNG
- Размер: квадратные, рекомендуется 800x800px или больше
- Тарелка должна быть круглой и занимать большую часть изображения
- Центр тарелки будет вырезан для размещения лиц

Также можно заменить фоновый паттерн:
- `background-pattern.svg` — паттерн вокруг тарелки

---

## Настройка EmailJS

EmailJS позволяет отправлять email напрямую из браузера.

### Шаг 1: Создание аккаунта
1. Перейдите на [emailjs.com](https://www.emailjs.com/)
2. Зарегистрируйтесь (бесплатный план — 200 писем/месяц)

### Шаг 2: Настройка Email Service
1. В Dashboard перейдите в **Email Services**
2. Нажмите **Add New Service**
3. Выберите провайдера (рекомендуется **Gmail** или **Outlook**)
4. Следуйте инструкциям для подключения
5. Запомните **Service ID** (например, `service_abc123`)

### Шаг 3: Создание Email Template
1. Перейдите в **Email Templates**
2. Нажмите **Create New Template**
3. Настройте шаблон:

**Subject:**
```
Ваш портрет на тарелке готов!
```

**Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
    h1 { color: #6c5ce7; }
    img { max-width: 100%; border-radius: 10px; margin: 20px 0; }
    .footer { color: #888; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Ваш портрет готов!</h1>
    <p>{{message}}</p>
    <img src="{{image}}" alt="Ваш портрет на тарелке">
    <p>Дата создания: {{date}}</p>
    <div class="footer">
      <p>Это письмо было отправлено автоматически. Спасибо за участие!</p>
    </div>
  </div>
</body>
</html>
```

4. В настройках шаблона:
   - **To Email:** `{{to_email}}`
   - **Reply To:** `{{reply_to}}`
5. Сохраните и запомните **Template ID**

### Шаг 4: Получение Public Key
1. Перейдите в **Account** → **General**
2. Скопируйте **Public Key**

---

## Настройка Google Sheets

Google Sheets + Apps Script сохраняет email-адреса посетителей.

### Шаг 1: Создание таблицы
1. Создайте новую [Google Таблицу](https://sheets.google.com)
2. Назовите первый лист `Emails`
3. Добавьте заголовки в первую строку:
   - A1: `Email`
   - B1: `Timestamp`
   - C1: `User Agent`

### Шаг 2: Создание Apps Script
1. В таблице: **Расширения** → **Apps Script**
2. Удалите стандартный код и вставьте:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.email,
      data.timestamp || new Date().toISOString(),
      data.userAgent || 'Unknown'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Photo Collage Email Collection API')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### Шаг 3: Деплой как Web App
1. Нажмите **Развернуть** → **Новое развертывание**
2. Тип: **Веб-приложение**
3. Настройки:
   - **Выполнять как:** Я (ваш email)
   - **Доступ:** Все
4. Нажмите **Развернуть**
5. Скопируйте **URL веб-приложения**

---

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxx

# Google Sheets Configuration (опционально)
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec
```

---

## Деплой

### Локальное тестирование
```bash
npm install
npm run dev
```

Откройте `http://localhost:3000` в браузере.

### Тест на мобильном устройстве
1. Узнайте локальный IP: `ipconfig` (Windows) / `ifconfig` (Mac/Linux)
2. Откройте `http://YOUR_IP:3000` на телефоне
3. **Важно:** Камера требует HTTPS (кроме localhost)

### Продакшн-деплой

#### Vercel (рекомендуется)
```bash
npm i -g vercel
vercel
```
Добавьте переменные окружения в Dashboard Vercel.

#### Netlify
```bash
npm run build
```
Загрузите папку `dist` на Netlify.

---

## Чеклист перед запуском

- [ ] Заменены изображения тарелок (`plate-1.jpg`, `plate-2.jpg`, `plate-3.jpg`)
- [ ] Настроен фоновый паттерн (опционально)
- [ ] EmailJS настроен и работает
- [ ] Google Sheets настроен (опционально)
- [ ] Тест камеры на iOS Safari
- [ ] Тест камеры на Android Chrome
- [ ] Тест отправки email
- [ ] Сайт работает по HTTPS
