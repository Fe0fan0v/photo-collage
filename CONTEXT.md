# Контекст работы: Фото-коллаж на тарелке

## Описание проекта
Веб-приложение для выставки: два участника делают фото, система удаляет фон, соединяет половинки лиц на декоративной тарелке.

## Серверы

| Сервис | URL |
|--------|-----|
| Сайт | https://seletti-hybrid.de-light.ru |
| API | https://seletti-hybrid.de-light.ru/api |
| SSH | admin@158.160.141.83 |

**IP сервера**: 158.160.141.83
**Домен**: seletti-hybrid.de-light.ru (ранее collage.heliad.ru)
**Репозиторий**: https://github.com/Fe0fan0v/photo-collage.git

## Структура проекта

```
photo-collage/
├── index.html
├── package.json
├── vite.config.js
├── GOOGLE_SETUP_INSTRUCTIONS.md  # Инструкция по настройке Google API
├── EMAIL_SETUP_INSTRUCTIONS.md   # Инструкция по настройке EmailJS
├── src/
│   ├── main.js               # Точка входа
│   ├── styles/
│   │   └── main.css
│   ├── screens/
│   │   ├── camera.js         # Камера + захват фото (стартовый экран)
│   │   ├── photo-review.js   # Индивидуальный просмотр/переснять фото
│   │   ├── photos-ready.js   # Подтверждение готовности фото + переснять
│   │   ├── plate-select.js   # Выбор тарелки (6 вариантов)
│   │   ├── processing.js     # Обработка + анимированный прелоадер
│   │   ├── success.js        # Результат + действия
│   │   ├── email-form.js     # Ввод 2 email + типы клиентов
│   │   ├── telegram-promo.js # Подтверждение "Готово!" + Telegram промо
│   │   └── final.js          # Финальный экран с коллажем + промо + кнопки
│   ├── services/
│   │   ├── background-removal.js  # Вызов API бэкенда
│   │   ├── collage.js        # Сборка коллажа на Canvas
│   │   ├── emailjs.js        # Отправка email через backend SMTP
│   │   └── google-sheets.js  # (устарело, теперь через backend)
│   ├── utils/
│   │   └── helpers.js
│   └── assets/
│       ├── background-pattern.png     # Фоновый паттерн "ёлочка" (200x200)
│       ├── logo.png                   # Логотип SELETTI × DELIGHT
│       ├── backage.png                # Фон коллажа с логотипами (1240x1748)
│       ├── russian-hybrid-logo.png    # Логотип RUSSIAN HYBRID (1240x384)
│       ├── plate-1.png                # Гжель + зелёный дракон (600x600, 599KB)
│       ├── plate-2.png                # Оранжево-чёрная хохлома + синие цветы (600x600, 654KB)
│       ├── plate-3.png                # Чёрная хохлома + синие тюльпаны (600x600, 708KB)
│       ├── plate-4.png                # Красно-жёлтая хохлома + изник (600x600, 531KB)
│       ├── plate-5.png                # Синий изник + бело-синие цветы (600x600, 548KB)
│       ├── plate-6.png                # Зелёные цветы + чёрная хохлома (600x600, 659KB)
│       ├── plate-1-thumb.png          # Превью тарелки 1 (150x150, 51KB)
│       ├── plate-2-thumb.png          # Превью тарелки 2 (150x150, 53KB)
│       ├── plate-3-thumb.png          # Превью тарелки 3 (150x150, 56KB)
│       ├── plate-4-thumb.png          # Превью тарелки 4 (150x150, 47KB)
│       ├── plate-5-thumb.png          # Превью тарелки 5 (150x150, 47KB)
│       └── plate-6-thumb.png          # Превью тарелки 6 (150x150, 55KB)
├── backend/
│   ├── main.py               # FastAPI сервер
│   ├── google_services.py    # Интеграция с Google Drive + Sheets
│   ├── email_service.py      # SMTP email сервис
│   ├── requirements.txt
│   ├── .env.example          # Пример переменных окружения
│   └── venv/                 # Python виртуальное окружение
└── uploads/                  # Локальные копии коллажей (backup)
```

## Технологии

### Frontend
- Vite 5.4
- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas для коллажа
- getUserMedia API для камеры

### Backend
- Python 3.12
- FastAPI + Uvicorn
- rembg (модель u2net) - удаление фона
- MediaPipe FaceLandmarker - детекция лица и глаз
- OpenCV (haarcascade) - fallback детекция
- Google Drive API - сохранение коллажей
- Google Sheets API - запись данных
- SMTP (smtplib) - отправка email через backend

### Инфраструктура
- Nginx - reverse proxy + SSL termination
- Let's Encrypt - SSL сертификат (автообновление)
- Systemd - автозапуск сервисов

## API Endpoints

Base URL: `https://seletti-hybrid.de-light.ru/api`

### GET /api/health
Проверка состояния сервера
```json
{"status": "ok", "model_loaded": true}
```

### POST /api/process-face
Удаление фона + детекция лица
- Input: multipart/form-data с изображением
- Output:
```json
{
  "image": "data:image/png;base64,...",
  "face": {
    "x": 0.25,      // позиция в % от ширины
    "y": 0.15,      // позиция в % от высоты
    "width": 0.5,   // ширина лица в %
    "height": 0.4,  // высота лица в %
    "found": true,
    "eyes": {
      "left": {"x": 0.3, "y": 0.35},
      "right": {"x": 0.7, "y": 0.35},
      "center": {"x": 0.5, "y": 0.35},
      "distance": 0.4
    }
  },
  "width": 1280,
  "height": 720
}
```

### POST /api/save-collage
Сохранение коллажа в Google Drive + запись в Google Sheets
- Input: JSON с полями `image` (data URL), `email`, `customerType`
- Output:
```json
{
  "success": true,
  "url": "https://drive.google.com/uc?export=view&id=...",
  "collageId": 123,
  "filename": "collage_20260205_174530_abc123.png",
  "savedToSheets": true
}
```
- Если Google API не настроен, сохраняет локально в `/uploads/`

### POST /api/send-email
Отправка email с коллажем через SMTP
- Input: JSON с полями `image` (data URL), `recipients` ([{email, customerType}])
- Output:
```json
{
  "success": true,
  "results": [
    {"email": "user@mail.ru", "success": true, "message": "Письмо отправлено"}
  ],
  "message": "Все письма отправлены"
}
```
- Если SMTP не настроен, возвращает `{"success": false, "message": "SMTP не настроен..."}`
- Поддержка нескольких получателей в одном запросе
- PNG-вложение `seletti-hybrid.png`

## Логика коллажа (collage.js)

### Размеры
- OUTPUT_WIDTH: 1100px (ширина canvas)
- OUTPUT_HEIGHT: 1550px (высота canvas, портретная ориентация)
- PLATE_SIZE: 868px (диаметр тарелки, соответствует прозрачному кругу в backage.png)
- FACE_WIDTH: 868px, FACE_HEIGHT: 868px (размер области для лиц)
- centerY: 874px (56.4% высоты - центр прозрачного круга в backage.png)

### Процесс
1. Обработать оба фото через `/api/process-face`
2. Нарисовать тарелку (PNG с прозрачностью)
3. Нарисовать лица в круге:
   - Масштабирование по межзрачковому расстоянию (24% ширины круга)
   - Выравнивание по позиции глаз (46% от верха круга)
   - Левая половина от фото 1, правая от фото 2
   - Обрезка по альфа-каналу тарелки
4. Нарисовать backage.png сверху (тарелка видна через прозрачный круг)
5. Нарисовать разделительную линию

## Команды для управления

```bash
# SSH на сервер
ssh admin@158.160.141.83

# Статус сервисов
sudo systemctl status collage-frontend
sudo systemctl status collage-backend

# Перезапуск сервисов
sudo systemctl restart collage-frontend
sudo systemctl restart collage-backend

# Логи сервисов
sudo journalctl -u collage-frontend -f
sudo journalctl -u collage-backend -f

# Nginx
sudo systemctl status nginx
sudo nginx -t  # проверка конфига
sudo systemctl reload nginx

# SSL сертификат (автообновляется certbot)
sudo certbot certificates
```

### Systemd сервисы

| Сервис | Файл | Описание |
|--------|------|----------|
| collage-frontend | /etc/systemd/system/collage-frontend.service | Vite dev server на порту 3007 |
| collage-backend | /etc/systemd/system/collage-backend.service | FastAPI на порту 3008 |

### Nginx конфигурация

Файл: `/etc/nginx/sites-enabled/seletti-hybrid.de-light.ru`

- `/` -> proxy_pass http://127.0.0.1:3007 (frontend)
- `/api/` -> proxy_pass http://127.0.0.1:3008/ (backend)

## Что сделано

### Основной функционал
- [x] Frontend с 9 экранами (camera, photo-review, photos-ready, plate-select, processing, success, email-form, telegram-promo, final)
- [x] HTTPS через Let's Encrypt (домен seletti-hybrid.de-light.ru)
- [x] Python backend с rembg для удаления фона
- [x] Детекция лица и глаз через MediaPipe FaceLandmarker
- [x] Овальная маска для лиц (900x900px)
- [x] Выравнивание половинок по позиции глаз
- [x] Масштабирование по межзрачковому расстоянию

### Интеграции
- [x] Email отправка через SMTP (backend)
  - Перенесено с EmailJS (frontend) на SMTP (backend)
  - Поддержка 2 email адресов в одном запросе
  - Типы клиентов (Частный покупатель, Дизайнер, Дилер, Поставщик)
  - PNG-вложение `seletti-hybrid.png`
  - Конфигурация через env-переменные (SMTP_HOST, SMTP_PORT и т.д.)
- [x] Google Drive API
  - Автоматическая загрузка коллажей
  - Публичные ссылки на изображения
  - Service Account аутентификация
- [x] Google Sheets API
  - Автоматическая запись данных (ID, дата, email, тип, ссылка)
  - Генерация последовательных ID
  - Service Account аутентификация

### UX улучшения
- [x] Превью первого фото при съемке второго
  - Обработка фото 1 сразу после захвата
  - Показ правильно позиционированного лица в левой половине овала
  - Второй человек видит точное положение для выравнивания
- [x] Индивидуальный просмотр/переснятие каждого фото
  - Экран photo-review для детального просмотра
  - Кнопка "ПЕРЕСНЯТЬ" с правильной позицией (лево/право)
  - Выбор фото из галереи
- [x] Telegram промо после отправки email
  - Экран подтверждения "Готово!"
  - Ссылка на Telegram канал
  - Переход на финальный экран с коллажем
- [x] Адаптивный дизайн для desktop и mobile
  - Media queries для экранов 768px+
  - Оптимизация размеров камеры и элементов управления
  - Корректное центрирование видео (object-position: center)
- [x] Улучшенная обработка ошибок
  - Детальные сообщения об ошибках API
  - Таймауты и fallback для сетевых запросов
  - Индикатор обработки фото
  - Graceful degradation если Google API не настроен

## Что нужно доработать

- [ ] Возможно: ручная корректировка позиции лица пользователем (если понадобится)

## Известные проблемы

1. **Детекция лица** - MediaPipe надёжнее haarcascade, но может не найти лицо при плохом освещении (есть fallback)
2. **Обработка времени** - удаление фона через rembg занимает 10-30 секунд на фото
3. **Первый запуск backend** - скачивание модели MediaPipe (~5MB) при первом запуске

---

## Последние изменения (2026-02-12)

### Смена домена на seletti-hybrid.de-light.ru

#### Что сделано
- **Домен**: `collage.heliad.ru` → `seletti-hybrid.de-light.ru`
- **SSL**: новый сертификат Let's Encrypt (действует до 13.05.2026)
- **Nginx**: новый конфиг `/etc/nginx/sites-enabled/seletti-hybrid.de-light.ru`
- **Vite**: добавлен `seletti-hybrid.de-light.ru` в `allowedHosts`
- **Backend `.env`**: обновлён `PUBLIC_URL`
- **Старый конфиг** `collage.heliad.ru` удалён
- **Тайтл страницы**: `Фото-коллаж` → `Seletti Hybrid`

### Настройка Google Cloud + Drive + Sheets

#### Google Cloud проект
- **Проект**: `seletti-collage` (Google Cloud Console)
- **Service Account**: `collage-service@seletti-collage.iam.gserviceaccount.com`
- **Включённые API**: Google Sheets API, Google Drive API, IAM API
- **Ключ**: `backend/credentials.json` (не коммитится в репозиторий)

#### Google Sheets
- **Таблица**: "Seletti Collages Database"
- **GOOGLE_SHEETS_ID**: `1dxStIaJgkqgea1IhC4IM6_Ih6Jj-v6YCC2GRDkt-3VU`
- **Лист**: "Коллажи"
- **Столбцы**: ID | Дата и время | Email | Тип клиента | Ссылка на коллаж
- **Форматирование**: жирные заголовки, ширина столбцов, закреплённая первая строка
- **Валидация**: выпадающий список типов клиентов (Частный покупатель, Дизайнер, Дилер, Поставщик)
- **Доступ**: Service Account (редактор), аккаунт ok.lena.kazah@gmail.com (владелец)

#### Google Drive
- **Папка**: "Seletti Collages"
- **GOOGLE_DRIVE_FOLDER_ID**: `1hUav6hoIpVr4fR4b6xIpKQ3O4hKl3Axw`
- **Доступ**: Service Account (редактор), публичный доступ по ссылке (читатель)
- Коллажи загружаются как PNG с публичными ссылками

#### Скрипты автоматизации (локальные)
- **`backend/setup_google_cloud.bat`** — создание проекта, API, Service Account через gcloud CLI
- **`backend/create_google_sheet.py`** — создание таблицы с форматированием через API

#### Backend .env (на сервере)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=Ok.lena.kazah@gmail.com
SMTP_PASSWORD=<app-password>
SMTP_FROM=Ok.lena.kazah@gmail.com
SMTP_FROM_NAME=Seletti Russia
SMTP_USE_TLS=true
GOOGLE_CREDENTIALS_PATH=credentials.json
GOOGLE_SHEETS_ID=1dxStIaJgkqgea1IhC4IM6_Ih6Jj-v6YCC2GRDkt-3VU
GOOGLE_DRIVE_FOLDER_ID=1hUav6hoIpVr4fR4b6xIpKQ3O4hKl3Axw
PUBLIC_URL=https://seletti-hybrid.de-light.ru
```

---

## Изменения (2026-02-07 вечер)

### Новый фон коллажа с логотипом RUSSIAN HYBRID

#### Добавлен backage.png как фон коллажа
- **Файл**: `backage.png` (1240x1748px, 96KB)
- Включает логотип SELETTI RUSSIAN HYBRID сверху
- Паттерн "ёлочка" вокруг
- Текст SELETTI.RU снизу
- Прозрачный круг по центру (978px диаметр) для тарелки

#### Изменения в коллаже
- **Canvas размер**: изменен с 1100x1100 на **1100x1550** (портретный формат)
- **Соотношение сторон**: ~0.71 (соответствует backage.png)
- **Порядок слоёв**:
  1. Тарелка (самый нижний слой)
  2. Лица (обрезанные по форме тарелки)
  3. Backage.png (сверху, тарелка видна через прозрачный круг)
  4. Разделительная линия

#### Точное позиционирование тарелки
- **Размер тарелки**: 868px (соответствует прозрачному кругу)
- **Центр по X**: 550px (50% ширины)
- **Центр по Y**: 874px (56.4% высоты - точный центр круга в backage.png)
- Тарелка идеально вписывается в прозрачный круг без зазоров

### Оптимизация изображений тарелок

#### Уменьшение размера
- **Было**: 1500x1500px (~3MB каждая, всего ~18MB)
- **Стало**: 600x600px (~600KB каждая, всего ~3.6MB)
- **Оптимизация**: ~80% уменьшение размера

#### Добавлены thumbnails для быстрой загрузки
- **Размер**: 150x150px
- **Вес**: ~50KB каждая (всего ~310KB)
- **Использование**: plate-select.js показывает thumbnails
- **Результат**: экран выбора тарелок загружается в ~12 раз быстрее

### Настройка SMTP для отправки email

#### Backend .env конфигурация
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=Ok.lena.kazah@gmail.com
SMTP_PASSWORD=ok33Poogle
SMTP_FROM=Ok.lena.kazah@gmail.com
SMTP_FROM_NAME=Seletti Russia
SMTP_USE_TLS=true
```

#### Функционал
- Email отправка настроена и работает
- Адрес отправителя: Ok.lena.kazah@gmail.com
- Два получателя поддерживаются
- PNG-вложение с коллажем

### Удалены дублирующиеся логотипы

#### Success и Final экраны
- Убран russian-hybrid-logo.png с обоих экранов
- Логотип теперь только в коллаже (часть backage.png)
- Более чистый и лаконичный дизайн

#### Файлы
- `russian-hybrid-logo.png` (1240x384px) - извлечен из backage.png, но не используется на экранах
- Сохранён в assets для возможного использования в будущем

---

## Последние изменения (2026-02-07 утро)

### Перенос отправки email с EmailJS (frontend) на SMTP (backend)

#### Зачем
- Убрана зависимость от стороннего сервиса EmailJS
- Email отправляется напрямую через SMTP с сервера
- Адрес отправителя: `hello@seletti.ru`

#### Backend
- **Создан `backend/email_service.py`** — SMTP-сервис:
  - Класс `EmailService` (по аналогии с `GoogleServices`)
  - Конфигурация через env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`, `SMTP_USE_TLS`
  - `is_configured()` — проверка наличия обязательных настроек
  - `send_email()` — отправка одного письма с PNG-вложением
  - `send_to_multiple()` — отправка нескольким получателям
  - HTML-тело на русском, вложение `seletti-hybrid.png`
  - Только встроённые модули Python (`smtplib`, `email.mime.*`)

- **Новый endpoint `POST /send-email`** в `main.py`:
  - Принимает `{image, recipients: [{email, customerType}]}`
  - Декодирует base64, отправляет через SMTP
  - Обёрнут в `asyncio.to_thread()` (не блокирует event loop)
  - Возвращает `{success, results: [{email, success, message}], message}`

#### Frontend
- **`src/services/emailjs.js`** — полностью переписан:
  - `sendCollageEmail()` / `sendCollageToMultiple()` → `fetch('/api/send-email')`
  - Удалён импорт `@emailjs/browser`
  - `isEmailJSConfigured()` → всегда `true` (обратная совместимость)

- **`src/screens/email-form.js`** — упрощён:
  - Удалён импорт `saveEmailToSheets` (был no-op)
  - Один запрос `sendCollageToMultiple()` вместо отдельных вызовов

#### Конфигурация
- **`package.json`** — удалена зависимость `@emailjs/browser`
- **`backend/.env.example`** — добавлены SMTP-переменные
- Новых pip-зависимостей нет (только встроённые модули Python)

#### Статус
- SMTP_PASSWORD пока не предоставлен — сервис корректно возвращает ошибку "SMTP не настроен"
- Когда пароль будет получен — достаточно добавить в `.env` на сервере и перезапустить backend

---

## Последние изменения (2026-02-05 вечер)

### Интеграция с Google Drive и Google Sheets

#### Backend: Google Services
- **Создан модуль `google_services.py`** для работы с Google API
  - Service Account аутентификация (без Apps Script)
  - Автоматическая загрузка коллажей в Google Drive
  - Автоматическая запись данных в Google Sheets
  - Генерация публичных ссылок на коллажи
  - Последовательная нумерация коллажей

- **Endpoint `/api/save-collage`**:
  - Принимает коллаж + email + customerType
  - Загружает в Google Drive с публичным доступом
  - Записывает строку в Google Sheets (ID, дата/время, email, тип, URL)
  - Возвращает публичную ссылку на коллаж
  - Локальный backup в папку `/uploads/` (на случай если Google API недоступен)

#### Настройка через UI (без кода)
- **Создан GOOGLE_SETUP_INSTRUCTIONS.md** - пошаговая инструкция:
  - Создание проекта в Google Cloud Console
  - Включение Google Drive API и Google Sheets API
  - Создание Service Account и получение JSON ключа
  - Настройка Google Таблицы с доступом для Service Account
  - Создание папки в Google Drive с публичным доступом
  - Все настройки через веб-интерфейс, без программирования

#### Frontend изменения
- Упрощена отправка коллажей - один запрос `/api/save-collage` вместо отдельных вызовов
- Backend сам загружает в Drive и пишет в Sheets
- Автоматическое сохранение при отправке email

#### Структура Google Sheets
Таблица автоматически заполняется со столбцами:
- **ID** - последовательный номер коллажа
- **Дата и время** - в формате DD.MM.YYYY HH:MM:SS
- **Email** - первый email из формы
- **Тип клиента** - Частный покупатель / Дизайнер / Дилер / Поставщик
- **Ссылка на коллаж** - прямая ссылка на изображение в Google Drive

### Новые экраны workflow

#### Photo Review Screen (индивидуальный просмотр)
- Детальный просмотр каждого фото отдельно
- Овал-гид с центральной линией
- Кнопка "ПЕРЕСНЯТЬ" позиционируется в зависимости от фото:
  - Фото 1 (левая сторона) → кнопка слева
  - Фото 2 (правая сторона) → кнопка справа
- Half-overlay затемнение противоположной стороны
- Превью-миниатюра кликабельна для выбора из галереи
- Инструкция: "Поместите лицо в овал. Разделение произойдет по желтой линии"

#### Telegram Promo Screen
- Показывается после отправки email
- Большая надпись "Готово!"
- Текст промо: "Выиграть тарелку из новой коллекции в Telegram"
- Логотип Telegram (SVG с градиентом)
- Кликабельная ссылка "Хочу тарелку!" → https://t.me/seletti_russia
- Ссылка www.seletti.ru внизу
- Крестик закрытия ведет на Final screen

#### Final Screen (коллаж + промо + кнопки)
- Прокручиваемый экран со всем контентом
- Плейсхолдер "SELETTI RUSSIAN HYBRID" (логотип будет позже)
- Коллаж тарелки
- Telegram промо блок (тот же что на предыдущем экране)
- Две желтые кнопки:
  - "ОТПРАВИТЬ НА ПОЧТУ В ХОРОШЕМ КАЧЕСТВЕ"
  - "РАСПЕЧАТАТЬ У МЕНЕДЖЕРА СТЕНДА"
- При клике на кнопки:
  - Если email уже заполнен → отправляет сразу
  - Если нет → переходит на email форму
- Сообщение "Отправлено!" (overlay с анимацией, автозакрытие 2.5 сек)

### Обновленный Email Form
- Поддержка **двух email** адресов:
  - Email 1* (обязательный)
  - Email 2 (опциональный)
- Два выпадающих списка "Вы" с типами клиентов
- Отправка на оба email если указаны
- Крестик закрытия возвращает на success screen
- Только кнопка "ОТПРАВИТЬ" (убраны лишние элементы)

### Обновленный workflow приложения

```
Camera (фото 1)
  → Camera (фото 2)
  → Photos Ready (подтверждение + клик на превью)
  → Photo Review (индивидуальный просмотр + переснять)
  → Photos Ready (возврат)
  → Plate Selection (выбор из 6 тарелок)
  → Processing (анимация обработки)
  → Success (результат + кнопки)
  → Email Form (ввод 2 email + типы)
  → Telegram Promo ("Готово!" + промо)
  → Final (коллаж + промо + кнопки отправки)
```

При клике на кнопки "ОТПРАВИТЬ" или "РАСПЕЧАТАТЬ" на Final screen:
- Коллаж загружается в Google Drive
- Данные записываются в Google Sheets
- Email отправляется через backend SMTP (`/api/send-email`)
- Показывается "Отправлено!"

### Nginx обновления
- Добавлен location `/uploads/` для отдачи локальных копий коллажей
- CORS заголовки для images
- Кэширование uploaded images (7 дней)

### Технические детали

#### Python зависимости
```
google-auth
google-auth-oauthlib
google-auth-httplib2
google-api-python-client
```

#### Environment variables
```bash
GOOGLE_CREDENTIALS_PATH=credentials.json
GOOGLE_SHEETS_ID=your_sheets_id
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
PUBLIC_URL=https://seletti-hybrid.de-light.ru

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=Ok.lena.kazah@gmail.com
SMTP_PASSWORD=<app-password>
SMTP_FROM=Ok.lena.kazah@gmail.com
SMTP_FROM_NAME=Seletti Russia
SMTP_USE_TLS=true
```

#### Безопасность
- Service Account JSON не коммитится в репозиторий
- API ключи через environment variables
- Graceful degradation если Google API не настроен
- Локальный backup коллажей в папку uploads/

---

## Последние изменения (2026-02-05 утро)

### Полное обновление UI/UX

#### Новые экраны и функции
- **Photos Ready Screen** - промежуточный экран после съемки обоих фото
  - Превью обоих фотографий
  - Индивидуальные кнопки "ПЕРЕСНЯТЬ" под каждым фото
  - Возможность пересъемки конкретного фото без потери другого
  - Кнопка "ДАЛЕЕ" для продолжения к выбору тарелки

#### Анимации и визуальная обратная связь
- **Анимация после первого фото:**
  - Желтая галочка появляется с плавной анимацией (scale + fade)
  - Пульсирующий контур овала-гида (желтое свечение)
  - Текст "⏳ Обработка..." во время обработки
  - Устраняет ощущение зависания (1-2 секунды обработки)

#### Обновленный экран выбора тарелки
- **6 тарелок** вместо 3 (новые дизайны добавлены)
- **Вертикальная раскладка** с прокруткой
- **Желтые круги с номерами** (1-6) чередуются слева/справа от тарелок
- Заголовок "Выберите фон"
- Кнопка "СОЗДАТЬ HYBRID"
- Анимация при выборе (масштабирование + желтая обводка)

#### Экран обработки (Processing)
- Заголовок "Создаем Hybrid"
- Анимированный прелоадер (крутящийся spinner)
- Динамический текст с этапами:
  - "Подготовка..."
  - "Обрабатываем фото 1..."
  - "Обрабатываем фото 2..."
  - "Загружаем фон..."
  - "Создаем гибрид..."
  - "Финальные штрихи..."
- Убран прогресс-бар (заменен на текст + spinner)
- Темный полупрозрачный фон для читаемости

#### Обновленный Success экран
- Показ готового коллажа
- Три основные кнопки:
  - "ОТПРАВИТЬ НА ПОЧТУ В ХОРОШЕМ КАЧЕСТВЕ"
  - "РАСПЕЧАТАТЬ У МЕНЕДЖЕРА СТЕНДА"
  - "НАЧАТЬ СНАЧАЛА" (компактная)
- Подтверждение "Готово!" после отправки email (автозакрытие через 2.5 сек)
- Темный фон для всего экрана

#### Email Form экран
- Поле "Email*" (обязательное)
- Выпадающий список "Вы" (необязательный):
  - Частный покупатель (по умолчанию)
  - Дизайнер
  - Дилер
  - Поставщик
- Кнопка "ОТПРАВИТЬ"
- Желтая кнопка закрытия (×) в правом верхнем углу
- Неактивные (затемненные) кнопки на фоне
- Возврат к Success экрану при закрытии

#### Единый стиль всех экранов
- Темный полупрозрачный фон `rgba(0, 0, 0, 0.85)` на ВСЕХ экранах:
  - Success
  - Photos Ready
  - Email Form
  - Plate Selection
  - Processing
- Закругленные углы контейнеров
- Отступы от краев (margin: 20px)
- Улучшенная читаемость текста на фоне паттерна "ёлочка"

#### Обновленный флоу приложения
```
Camera (фото 1)
  → Camera (фото 2)
  → Photos Ready (подтверждение + переснять)
  → Plate Selection (выбор из 6 тарелок)
  → Processing (анимация обработки)
  → Success (результат + действия)
  → Email Form (отправка на почту) [опционально]
  → Success (с "Готово!" 2.5 сек)
```

#### Технические улучшения
- Поддержка параметра `customerType` в EmailJS и Google Sheets
- Метод `retakePhoto(index)` для пересъемки конкретного фото
- Восстановление состояния камеры при возврате для пересъемки
- Передача параметров между экранами через `mount(params)`
- Кнопка закрытия с навигацией назад

---

## Изменения (2026-02-03)

### Редизайн UI в стиле SELETTI × DELIGHT
- **Брендинг**: логотип "SELETTI × DELIGHT" на белом полупрозрачном фоне
- **Фон**: паттерн "ёлочка" (chevron) из файла `background-pattern.png` (200px)
- **Цветовая схема**:
  - Акцент: жёлтый `#FFED00`
  - Фон: чёрный `#000000`
  - Текст: белый на тёмном, чёрный на жёлтом
- **Шрифт**: PT Sans Caption (Google Fonts)

### Экран камеры (стартовый)
- Welcome экран удалён — приложение сразу открывает камеру
- Камера с отступами по бокам (16px), закруглённые нижние углы
- Пунктирный белый овал для позиционирования лица
- Жёлтая вертикальная линия по центру
- Жёлтый индикатор стороны ("Левая половина" / "Правая половина")
- Инструкция на чёрном фоне для читаемости
- Компактная кнопка съёмки (56px): жёлтый круг + чёрная обводка 4px + жёлтое внешнее кольцо
- Миниатюры Фото1/Фото2: белая сплошная рамка (70x62px)
- Превью первого лица в овале (33% ширины, 77% высоты)

### Экран обработки
- Чёрная полупрозрачная подложка для читаемости текста

### Навигация
- "Сделать ещё фото" ведёт сразу на камеру (не на welcome)

### Файлы
- `src/assets/background-pattern.png` — фоновый паттерн
- `src/assets/logo.png` — логотип SELETTI × DELIGHT
- `src/screens/welcome.js` — удалён

---

## Изменения (2026-01-29)

### Настройка размеров лица и тарелки под референс
- **OUTPUT_SIZE**: остался 1100px (больше фона вокруг тарелки)
- **PLATE_SIZE**: 1035px → 900px (тарелка меньше относительно фона, ~82% вместо 94%)
- **FACE_WIDTH/HEIGHT**: 580x720 → 900x900px (полный размер тарелки для обрезки по PNG маске)
- **targetEyeDistance**: 28% → 24% (размер лица меньше, соответствует референсу)
- **targetEyeY**: 40% → 46% (глаза ниже, подбородок доходит до края тарелки)
- Лицо теперь рисуется на всю область тарелки и обрезается точно по PNG alpha-маске
- Нижний край лица (подбородок) обрезается по круглой форме тарелки, а не выше

### Переход на PNG тарелки с прозрачностью
- Тарелки теперь используют PNG формат с alpha-каналом
- Лица обрезаются через `globalCompositeOperation = 'destination-in'` с PNG маской
- Убраны функции removeWhiteBackground и createPlateMask (больше не нужны)
- Точная обрезка по форме тарелки без артефактов

### Исправление Vite конфигурации и доступности API
- Добавлен `allowedHosts: ['collage.heliad.ru', 'localhost']` в vite.config.js
- Убраны SSL сертификаты из Vite (./certs/ → ./certs.backup)
- Vite теперь работает в HTTP режиме, SSL обрабатывает только Nginx
- Исправлен API_URL: с `:3008` на `/api/` для работы через Nginx reverse proxy
- Backend доступен только через Nginx /api/, прямой доступ на порт 3008 закрыт

### Обновленные размеры коллажа
- OUTPUT_SIZE: 1100px
- PLATE_SIZE: 900px (~82% от canvas)
- FACE_WIDTH: 900px, FACE_HEIGHT: 900px (полный размер тарелки)
- Лицо вписывается в тарелку и обрезается по PNG alpha маске

### Обновленное позиционирование лица
- Масштабирование по межзрачковому расстоянию: 24% ширины овала
- Позиция глаз: 46% от верха овала (подбородок доходит до края)

---

## Изменения (2026-01-28)

### Исправление камеры на iPhone
- Добавлен `aspect-ratio: 4/3` для мобильного контейнера камеры
- Решает проблему смещения изображения ("камера смотрит слева") на iPhone 13
- Теперь пропорции контейнера фиксированы на всех устройствах

### Увеличение превью первого фото
- Размер превью увеличен для лучшего совпадения с овалом-гидом
- width: 30% → 31%, height: 70% → 72%
- left: 20% → 19% (корректировка центровки)

---

## Изменения (2026-01-26)

### MediaPipe FaceLandmarker для детекции глаз
- Заменён haarcascade на MediaPipe FaceLandmarker (tasks API v0.10+)
- Детектируются позиции глаз (iris landmarks 468, 473)
- Выравнивание половинок лиц по линии глаз (не по границам лица)
- Решает проблему с пышными прическами и бородами
- Автоматическое скачивание модели `face_landmarker.task` при запуске
- Fallback на haarcascade если MediaPipe не находит лицо

### Размеры коллажа (устарело, см. изменения от 2026-01-29)
- OUTPUT_SIZE: 1100px
- PLATE_SIZE: 900px (обновлено 2026-01-29)
- FACE_WIDTH: 900px, FACE_HEIGHT: 900px (обновлено 2026-01-29)
- Лицо рисуется на всю область тарелки и обрезается PNG alpha маской

### Позиционирование лица (устарело, см. изменения от 2026-01-29)
- Масштабирование по межзрачковому расстоянию (24% ширины овала, обновлено 2026-01-29)
- Позиция глаз: 46% от верха овала (обновлено 2026-01-29)

### Превью первого фото
- Показывает только ЛЕВУЮ половину обработанного лица
- Обрезка по области лица с padding для волос
- Отображается в левой половине овала-гида
- Полностью непрозрачное (opacity: 1)
- Растягивается на весь контейнер (background-size: 100% 100%)

### API response
- `/api/process-face` возвращает данные о глазах:
  ```json
  {
    "face": {
      "found": true,
      "x": 0.25, "y": 0.15,
      "width": 0.5, "height": 0.4,
      "eyes": {
        "left": {"x": 0.3, "y": 0.35},
        "right": {"x": 0.7, "y": 0.35},
        "center": {"x": 0.5, "y": 0.35},
        "distance": 0.4
      }
    }
  }
  ```
- `/api/health` возвращает статус MediaPipe:
  ```json
  {"status": "ok", "model_loaded": true, "mediapipe_loaded": true}
  ```

---

## Изменения (2026-01-25)

### Настройка домена и SSL
- Домен: collage.heliad.ru
- Nginx как reverse proxy (frontend + backend через один домен)
- Let's Encrypt SSL сертификат (действует до 25.04.2026)
- Systemd сервисы для автозапуска при перезагрузке
- API теперь доступен через `/api/` вместо отдельного порта :3008
- Убраны самоподписанные сертификаты (больше не нужно принимать вручную)

### Коммит c92a6c2: Превью с правильным позиционированием лица
- После захвата первого фото оно сразу обрабатывается через API
- Создаётся canvas с правильным позиционированием лица (как в финальном коллаже)
- В превью отображается только левая половина овала с лицом первого человека
- Второй человек видит точное положение для выравнивания своего лица
- Добавлен индикатор "⏳ Обработка..." во время обработки фото 1

### Коммит 9808369: Улучшения обработки ошибок, UI/UX и адаптивности
- **Обработка ошибок**: детальная диагностика ошибок API, проверка доступности backend
- **Центрирование камеры**: добавлено `object-position: center` для корректного отображения
- **Адаптивность**: media queries для desktop (768px+), оптимизация размеров элементов
- **UX**: предупреждение на welcome screen если backend недоступен

### Ранее
- Переход с клиентской библиотеки @imgly/background-removal на серверный rembg (быстрее загрузка)
- Добавлена детекция лица для точного позиционирования
- Овальная маска вместо круглой
- Выравнивание по верхнему краю лица (лоб)
