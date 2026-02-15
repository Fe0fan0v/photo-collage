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
│   │   ├── telegram-promo.js # (устарел, теперь popup в final.js)
│   │   └── final.js          # Финальный экран с коллажем + popup промо + кнопки
│   ├── services/
│   │   ├── background-removal.js  # Вызов API бэкенда
│   │   ├── collage.js        # Сборка коллажа на Canvas
│   │   ├── emailjs.js        # Отправка email через backend SMTP
│   │   └── google-sheets.js  # (устарело, теперь через backend)
│   ├── utils/
│   │   ├── helpers.js
│   │   └── session-persistence.js  # Сохранение/восстановление состояния в sessionStorage
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
│   ├── get_oauth_token.py    # Скрипт получения OAuth2 токена для Drive
│   ├── oauth_token.json      # OAuth2 refresh token (не коммитится)
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
4. **OOM Kill** - при высокой нагрузке (несколько одновременных обработок фото) backend может быть убит OOM killer (сервер 3.8 GB RAM)

---

## Изменения (2026-02-15 ночь)

### Исправление 6 багов мобильного использования

#### 1-2. Превью фото на камере → photo-review вместо file picker
- **`src/screens/camera.js`**: клик по thumbnail теперь через `handleThumbnailClick()`
  - Фото есть → навигация на экран photo-review
  - Фото нет → открывается file picker (как раньше)
- Ранее клик по превью ВСЕГДА открывал файловый диалог

#### 3. Photos-ready: клик по фото не работал на мобильных
- **`src/styles/main.css`**: на `.photo-ready-image` добавлены `-webkit-touch-callout: none`, `user-select: none`, `pointer-events: none`
- **`src/screens/photos-ready.js`**: `draggable: 'false'` на обоих `<img>`
- Мобильные браузеры перехватывали клик по `<img>` (контекстное меню "сохранить изображение"), теперь клик проходит через родительский `.photo-ready-card`

#### 4. Потеря прогресса при блокировке телефона (session persistence)
- **Создан `src/utils/session-persistence.js`**:
  - `saveSession(screenName, state)` — сериализует фото в base64, сохраняет в `sessionStorage`
  - `restoreSession()` — восстанавливает состояние из `sessionStorage`
  - `clearSession()` — очищает `sessionStorage`
  - Экраны `processing`, `success`, `final` не восстанавливаются — fallback на `photosReady`/`camera`
  - Фото хранятся как base64 data URL (~100-300KB каждое, лимит sessionStorage 5MB)
- **`src/main.js`**:
  - `init()`: проверяет сохранённое состояние и восстанавливает при перезагрузке
  - `navigateTo()`: сохраняет состояние после каждого перехода
  - `reset()`: очищает sessionStorage

#### 5. Google Sheets не получает данные
- Нужно расшарить таблицу для `collage-service@seletti-hybrid.iam.gserviceaccount.com` как **Редактор**
- Ручное действие в интерфейсе Google Sheets

#### 6. Явное московское время в backend
- **`backend/main.py`**: `from zoneinfo import ZoneInfo`
- Все `datetime.now()` заменены на `datetime.now(ZoneInfo('Europe/Moscow'))`
- Затронуты: timestamp в имени файла и datetime_str для Google Sheets

### Исправление сохранения второго email в Google Sheets

#### Проблема
- `/save-collage` получал только `email: email1` — в таблицу записывалась одна строка
- Второй email из формы полностью игнорировался при записи в Sheets

#### Исправление
- **`backend/main.py`**: `/save-collage` принимает массив `recipients`
  - Записывает отдельную строку для каждого получателя (один collage ID, одна дата, один URL)
  - Обратная совместимость: если `recipients` нет, использует `email`/`customerType`
- **`src/screens/email-form.js`**: передаёт `recipients` в `/save-collage`
- **`src/screens/final.js`**: аналогично передаёт `recipients` в `/save-collage`

---

## Последние изменения (2026-02-15 вечер)

### Уменьшение размера лица на тарелке по референсу

- **`targetEyeDistance`**: 24% → 21% (лицо меньше, больше видно орнамент тарелки)
- **`targetEyeY`**: 46% → 47% (лицо по центру тарелки, как на референсе)

### Обновление Telegram ссылки

- Все ссылки на Telegram обновлены: `t.me/seletti_russia` → `t.me/selettistoremoscow/607`
- Затронутые файлы: `final.js`, `telegram-promo.js`

### Редизайн Final Screen и popup "Готово!"

#### Final Screen
- Порядок элементов: коллаж → Telegram секция → 3 кнопки → www.seletti.ru
- Telegram секция между коллажем и кнопками (текст + иконка + "Хочу тарелку!")
- Все 3 кнопки вместе: ОТПРАВИТЬ НА ПОЧТУ, РАСПЕЧАТАТЬ, НАЧАТЬ СНАЧАЛА
- www.seletti.ru внизу под кнопками

##### Структура экрана
```
┌─────────────────────────────┐
│ Logo header                  │
├─────────────────────────────┤
│ Коллаж                       │
│ Выиграть тарелку...          │  ← всё скроллируется
│    [TG icon 48px]            │
│   Хочу тарелку!              │
│ [ОТПРАВИТЬ НА ПОЧТУ]         │
│ [РАСПЕЧАТАТЬ У МЕНЕДЖЕРА]    │
│ [НАЧАТЬ СНАЧАЛА]             │
│      www.seletti.ru          │
└─────────────────────────────┘
```

#### Popup "Готово!" (после отправки email)
- Простой overlay: "Готово!" + Telegram промо (текст + иконка + "Хочу тарелку!")
- Жёлтый × для закрытия (без автозакрытия)
- Без кнопок действий в popup — они на основном экране под overlay

##### Структура popup
```
┌─────────────────────────────┐
│ (полупрозрачный фон)     [×] │  ← жёлтый круг
│                               │
│         Готово!                │
│   Выиграть тарелку...         │
│       [TG icon]               │
│     Хочу тарелку!             │
│                               │
│ (коллаж виден за overlay)     │
└─────────────────────────────┘
```

### Success Screen: seletti.ru под кнопками

- seletti.ru перемещён ниже всех 3 кнопок (был между коллажем и кнопками)

### Photos Ready Screen

- Убрана верхняя кнопка "ДАЛЕЕ" (осталась только нижняя)

### Email Form Screen: чекбокс согласия на обработку персональных данных

- Добавлен чекбокс перед кнопкой "ОТПРАВИТЬ"
  - Текст: "Даю согласие на обработку персональных данных"
  - "обработку персональных данных" — жёлтая гиперссылка на https://www.de-light.ru/showcase/terms/
  - Жёлтая рамка чекбокса, при нажатии — жёлтый фон с чёрной ✓
  - Кнопка "ОТПРАВИТЬ" неактивна (disabled) пока галочка не поставлена

### Стрелка в выпадающем списке (select)

- Кастомная жёлтая стрелка вниз в `.form-select` через SVG background-image (`#FFED00`)
- `appearance: none` для убирания стандартного вида
- `padding-right: 44px` чтобы текст не налезал на стрелку

### Telegram: deep link через tg:// протокол

- Ссылки заменены с `https://t.me/selettistoremoscow/607` на `tg://resolve?domain=selettistoremoscow&post=607`
- Открывает приложение Telegram напрямую, минуя промежуточную веб-страницу t.me

### Final Screen: кнопки всегда ведут на форму email

- Кнопки "ОТПРАВИТЬ НА ПОЧТУ" и "РАСПЕЧАТАТЬ" на final screen всегда переходят на email-form
- Ранее: если email уже был сохранён, пытались отправить повторно без подтверждения
- Теперь: пользователь всегда проходит через форму для ввода/подтверждения email и роли

---

## Изменения (2026-02-14 вечер)

### Исправление зависания экрана отправки email

#### Проблема
- Кнопка "Отправляем..." зависала навсегда на мобильном (LTE)
- Два тяжёлых fetch-запроса (save-collage + send-email) шли **последовательно** без таймаутов
- Уведомление менеджеру блокировало ответ пользователю (ещё +30 сек)
- SMTP пароль был обычным (не пароль приложения) — mail.ru отклонял авторизацию

#### Исправления

##### Frontend: таймауты и параллельные запросы
- **`src/services/emailjs.js`**: добавлен `fetchWithTimeout()` с `AbortController` (90 сек таймаут)
- **`src/screens/email-form.js`**: `save-collage` и `send-email` запускаются **параллельно** через `Promise.all`
  - `save-collage` опциональный (`.catch()` → `null`), не блокирует отправку email
  - При таймауте показывается понятное сообщение, кнопка разблокируется
- **`src/screens/final.js`**: аналогичные параллельные запросы + один `sendCollageToMultiple` вместо отдельных вызовов на каждый email

##### Backend: асинхронное уведомление менеджеру
- **`backend/main.py`**: `send_manager_notification` через `asyncio.create_task()` (fire-and-forget)
  - Ответ пользователю уходит сразу после отправки его писем
  - Менеджерское письмо отправляется в фоне

##### SMTP: пароль приложения
- Обновлён `SMTP_PASSWORD` в `.env` на пароль приложения mail.ru
- Обычный пароль не работал: mail.ru требует пароль приложения для SMTP

#### Результат
| До | После |
|----|-------|
| save-collage (30с) + send 2 emails (60с) + manager (30с) = **120с** | max(save-collage, send 2 emails) = **~1-2с** |
| Без таймаута — зависание навечно | Таймаут 90с — кнопка разблокируется |
| SMTP auth error | SMTP работает |

### Переработка финального экрана (Final Screen) (устарело, см. 2026-02-15)

- Первоначально кнопки были в фиксированной нижней панели
- Позже переделано: всё в скроллируемой области, кнопки сразу под коллажем

### Telegram Promo как popup-overlay (устарело, см. 2026-02-15)

- Первоначально popup имел тёмную карточку с border-radius
- Позже переделано: элементы прямо на overlay без карточки, жёлтая кнопка закрытия, кнопка "НАЧАТЬ СНАЧАЛА"

### Миграция Google Services на новый аккаунт (2026-02-15)

#### Причина миграции
- Старый SA `collage-service@seletti-collage` перестал работать (ошибка "account not found")
- Старый аккаунт `ok.lena.kazah@gmail.com` больше не доступен

#### Новый Google Cloud проект
- **Проект**: `seletti-hybrid`
- **Аккаунт**: `goover1408@gmail.com`
- **Service Account**: `collage-service@seletti-hybrid.iam.gserviceaccount.com`
- **Включённые API**: Google Sheets API, Google Drive API, IAM API

#### Новые ресурсы
- **Google Sheets**: `1J6J-07kADP4k93VznIlYSdELk48kziMVOxaLWqQQfTo` ("Seletti Hybrid - Collages")
  - Столбцы: Collage ID | Date/Time | Email | Customer Type | Collage URL
  - Доступ: goover1408@gmail.com (владелец), SA (редактор)
- **Google Drive папка**: `1pBBYQDLfgOJFxcbKmfrs8ad2aX9Kqpno` ("Seletti Hybrid Collages")
  - Публичный доступ по ссылке (читатель)
  - Доступ: goover1408@gmail.com (владелец)

#### Архитектура credentials
- **Google Sheets** → Service Account (`credentials_goover.json`)
- **Google Drive** → OAuth2 user token (`oauth_token_goover.json`) от goover1408@gmail.com
- `with_quota_project('seletti-hybrid')` для корректной тарификации API

#### Файлы credentials на сервере
- `/home/admin/photo-collage/backend/credentials_goover.json` — Service Account (для Sheets)
- `/home/admin/photo-collage/backend/oauth_token_goover.json` — OAuth2 refresh token (для Drive)

#### Обновление OAuth токена
Если токен протухнет, запустить локально:
```bash
cd backend && python get_oauth_token.py
# Откроется браузер для авторизации (goover1408@gmail.com)
# Загрузить на сервер:
B64=$(base64 -w0 oauth_token.json) && ssh admin@158.160.141.83 "echo '$B64' | base64 -d > /home/admin/photo-collage/backend/oauth_token_goover.json"
sudo systemctl restart collage-backend
```

### Очистка сервера
- Удалены контейнеры **engcrm** (frontend + backend + PostgreSQL)
- Отключён **MySQL** (не используется)
- **construction-accounting-system** оставлен (порты 3000, 8002, 5433)
- Освобождено ~1.5 GB RAM

---

## Изменения (2026-02-14)

### Смена SMTP на hello@seletti.ru через mail.ru

#### Что сделано
- **SMTP сервер**: `smtp.gmail.com` → `smtp.mail.ru`
- **Порт**: 587 (STARTTLS) → 465 (SSL)
- **Адрес отправителя**: `Ok.lena.kazah@gmail.com` → `hello@seletti.ru`
- **Протокол**: STARTTLS → SSL (`SMTP_USE_TLS=false` для SMTP_SSL)
- **Systemd**: добавлен `EnvironmentFile=/home/admin/photo-collage/backend/.env` в `collage-backend.service`

#### Backend .env (на сервере)
```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=hello@seletti.ru
SMTP_PASSWORD=<пароль>
SMTP_FROM=hello@seletti.ru
SMTP_FROM_NAME=Seletti Russia
SMTP_USE_TLS=false
MANAGER_EMAIL=hybrid@de-light.ru
GOOGLE_CREDENTIALS_PATH=credentials_goover.json
GOOGLE_SHEETS_ID=1J6J-07kADP4k93VznIlYSdELk48kziMVOxaLWqQQfTo
GOOGLE_DRIVE_FOLDER_ID=1pBBYQDLfgOJFxcbKmfrs8ad2aX9Kqpno
GOOGLE_OAUTH_TOKEN_PATH=oauth_token_goover.json
PUBLIC_URL=https://seletti-hybrid.de-light.ru
```

### Автоматическая отправка копии менеджеру

#### Функционал
- При каждой отправке коллажа пользователям копия автоматически отправляется на `hybrid@de-light.ru`
- Письмо менеджеру содержит:
  - Коллаж (PNG-вложение)
  - ID коллажа
  - Дата и время
  - Ссылка на коллаж в Google Drive
  - Таблица получателей (email + тип клиента)
- Настройка адреса менеджера через env-переменную `MANAGER_EMAIL`

#### Изменения в коде
- **`backend/email_service.py`**: добавлены методы `_build_manager_message()` и `send_manager_notification()`
- **`backend/main.py`**: endpoint `/send-email` принимает `collageInfo` и отправляет уведомление менеджеру
- **`src/services/emailjs.js`**: функции `sendCollageEmail()` и `sendCollageToMultiple()` передают `collageInfo`
- **`src/screens/email-form.js`**: перед отправкой email сохраняет коллаж в Drive/Sheets и передаёт данные менеджеру
- **`src/screens/final.js`**: передаёт `collageInfo` при повторной отправке

### Исправление загрузки фото из галереи

#### Проблема
- Кнопка "Фото 1 / Загрузь" работала только после съёмки первого фото
- Кнопка "Фото 2 / Загрузь" не имела обработчика клика

#### Исправление
- **`src/screens/camera.js`**: оба placeholder-а теперь кликабельны
- Фото 1 можно загрузить из галереи в любой момент
- Фото 2 можно загрузить из галереи после готовности Фото 1
- Два отдельных `<input type="file">` для каждого фото
- Загрузка из галереи корректно обновляет state и переключает шаг

### Исправление камеры после "переснять"

#### Проблема
- В `mount()` вызов `restoreExistingPhotos()` содержал `await processFace()` (10-30 сек)
- Камера запускалась только ПОСЛЕ завершения обработки фото
- Пользователь видел чёрный экран камеры при возврате через "переснять"

#### Исправление
- **`src/screens/camera.js`**: камера запускается ПЕРВОЙ в `mount()`, до любой обработки
- `restoreExistingPhotos()` стал синхронным (без `await`)
- `processFace()` и `preloadModel()` выполняются в фоне (fire-and-forget)
- Камера появляется мгновенно при возврате на экран

---

## Изменения (2026-02-12)

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
- **Проект**: `seletti-hybrid` (Google Cloud Console)
- **Аккаунт**: `goover1408@gmail.com`
- **Service Account**: `collage-service@seletti-hybrid.iam.gserviceaccount.com`
- **Включённые API**: Google Sheets API, Google Drive API, IAM API
- **SA ключ**: `backend/credentials_goover.json` (не коммитится в репозиторий)
- **OAuth токен**: `backend/oauth_token_goover.json` (не коммитится в репозиторий)

#### Google Sheets
- **Таблица**: "Seletti Hybrid - Collages"
- **GOOGLE_SHEETS_ID**: `1J6J-07kADP4k93VznIlYSdELk48kziMVOxaLWqQQfTo`
- **Лист**: "Collages"
- **Столбцы**: Collage ID | Date/Time | Email | Customer Type | Collage URL
- **Закреплённая первая строка** (заголовки)
- **Доступ**: goover1408@gmail.com (владелец), Service Account (редактор)

#### Google Drive
- **Папка**: "Seletti Hybrid Collages"
- **GOOGLE_DRIVE_FOLDER_ID**: `1pBBYQDLfgOJFxcbKmfrs8ad2aX9Kqpno`
- **Доступ**: goover1408@gmail.com (владелец), публичный доступ по ссылке (читатель)
- Коллажи загружаются через OAuth2 user token (SA не имеет storage quota на бесплатных аккаунтах)

#### Скрипты автоматизации (локальные)
- **`backend/setup_google_cloud.bat`** — создание проекта, API, Service Account через gcloud CLI
- **`backend/create_google_sheet.py`** — создание таблицы с форматированием через API

#### Backend .env (на сервере) — устарело, см. изменения от 2026-02-14

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

### Настройка SMTP для отправки email (устарело, см. изменения от 2026-02-14)

#### Функционал
- Email отправка настроена и работает
- Адрес отправителя: hello@seletti.ru (через smtp.mail.ru)
- Два получателя поддерживаются
- PNG-вложение с коллажем
- Автоматическая копия менеджеру hybrid@de-light.ru

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

#### Telegram Promo (popup-overlay в Final Screen)
- Появляется как popup после отправки email
- Элементы прямо на полупрозрачном overlay (без карточки), коллаж виден сквозь
- Жёлтая круглая кнопка закрытия ×
- "Готово!", промо-текст, Telegram иконка (48px), "Хочу тарелку!" → t.me/seletti_russia
- Кнопки действий, www.seletti.ru, "НАЧАТЬ СНАЧАЛА" → камера

#### Final Screen (коллаж + кнопки + промо)
- Всё в скроллируемой области, порядок: коллаж → кнопки → Telegram секция
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
  → Final (коллаж + Telegram popup-overlay + кнопки отправки)
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

# SMTP (mail.ru)
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=hello@seletti.ru
SMTP_PASSWORD=<пароль>
SMTP_FROM=hello@seletti.ru
SMTP_FROM_NAME=Seletti Russia
SMTP_USE_TLS=false
MANAGER_EMAIL=hybrid@de-light.ru
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
