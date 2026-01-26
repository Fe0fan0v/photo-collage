# Контекст работы: Фото-коллаж на тарелке

## Описание проекта
Веб-приложение для выставки: два участника делают фото, система удаляет фон, соединяет половинки лиц на декоративной тарелке.

## Серверы

| Сервис | URL |
|--------|-----|
| Сайт | https://collage.heliad.ru |
| API | https://collage.heliad.ru/api |
| SSH | admin@158.160.141.83 |

**IP сервера**: 158.160.141.83
**Репозиторий**: https://github.com/Fe0fan0v/photo-collage.git

## Структура проекта

```
photo-collage/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js               # Точка входа
│   ├── styles/
│   │   └── main.css
│   ├── screens/
│   │   ├── welcome.js        # Экран приветствия
│   │   ├── camera.js         # Камера + захват фото
│   │   ├── plate-selection.js # Выбор тарелки (3 варианта)
│   │   ├── processing.js     # Обработка + прогресс
│   │   └── success.js        # Результат + скачивание
│   ├── services/
│   │   ├── background-removal.js  # Вызов API бэкенда
│   │   └── collage.js        # Сборка коллажа на Canvas
│   ├── utils/
│   │   └── helpers.js
│   └── assets/
│       ├── plate-1.jpg
│       ├── plate-2.jpg
│       └── plate-3.jpg
└── backend/
    ├── main.py               # FastAPI сервер
    ├── requirements.txt
    └── venv/                 # Python виртуальное окружение
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

### Инфраструктура
- Nginx - reverse proxy + SSL termination
- Let's Encrypt - SSL сертификат (автообновление)
- Systemd - автозапуск сервисов

## API Endpoints

Base URL: `https://collage.heliad.ru/api`

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
    "found": true
  },
  "width": 1280,
  "height": 720
}
```

## Логика коллажа (collage.js)

### Размеры
- OUTPUT_SIZE: 1100px (итоговое изображение)
- PLATE_SIZE: 1035px (тарелка с орнаментом)
- FACE_WIDTH: 580px, FACE_HEIGHT: 720px (овал для лица внутри орнамента)

### Процесс
1. Обработать оба фото через `/api/process-face`
2. Нарисовать зигзаг-паттерн фона
3. Нарисовать тарелку (круглое изображение)
4. Нарисовать лица в овале:
   - Масштабирование по межзрачковому расстоянию (28% ширины овала)
   - Выравнивание по позиции глаз (40% от верха овала)
   - Левая половина от фото 1, правая от фото 2
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

Файл: `/etc/nginx/sites-enabled/collage.heliad.ru`

- `/` -> proxy_pass http://127.0.0.1:3007 (frontend)
- `/api/` -> proxy_pass http://127.0.0.1:3008/ (backend)

## Что сделано

### Основной функционал
- [x] Frontend с экранами (welcome, camera, plate-selection, processing, success)
- [x] HTTPS через Let's Encrypt (домен collage.heliad.ru)
- [x] Python backend с rembg для удаления фона
- [x] Детекция лица и глаз через MediaPipe FaceLandmarker
- [x] Овальная маска для лиц (580x720px)
- [x] Выравнивание половинок по позиции глаз
- [x] Масштабирование по межзрачковому расстоянию

### UX улучшения
- [x] Превью первого фото при съемке второго
  - Обработка фото 1 сразу после захвата
  - Показ правильно позиционированного лица в левой половине овала
  - Второй человек видит точное положение для выравнивания
- [x] Адаптивный дизайн для desktop и mobile
  - Media queries для экранов 768px+
  - Оптимизация размеров камеры и элементов управления
  - Корректное центрирование видео (object-position: center)
- [x] Улучшенная обработка ошибок
  - Детальные сообщения об ошибках API
  - Проверка доступности backend на welcome screen
  - Таймауты и fallback для сетевых запросов
  - Индикатор обработки фото

## Что нужно доработать

- [ ] Email отправка через EmailJS
- [ ] Сохранение email в Google Sheets
- [ ] Возможно: ручная корректировка позиции лица пользователем (если понадобится)

## Известные проблемы

1. **Детекция лица** - MediaPipe надёжнее haarcascade, но может не найти лицо при плохом освещении (есть fallback)
2. **Обработка времени** - удаление фона через rembg занимает 10-30 секунд на фото
3. **Первый запуск backend** - скачивание модели MediaPipe (~5MB) при первом запуске

## Последние изменения (2026-01-26)

### MediaPipe FaceLandmarker для детекции глаз
- Заменён haarcascade на MediaPipe FaceLandmarker (tasks API v0.10+)
- Детектируются позиции глаз (iris landmarks 468, 473)
- Выравнивание половинок лиц по линии глаз (не по границам лица)
- Решает проблему с пышными прическами и бородами
- Автоматическое скачивание модели `face_landmarker.task` при запуске
- Fallback на haarcascade если MediaPipe не находит лицо

### Размеры коллажа
- OUTPUT_SIZE: 1100px
- PLATE_SIZE: 1035px (увеличено на 15%)
- FACE_WIDTH: 580px, FACE_HEIGHT: 720px
- Лицо вписывается внутрь орнамента тарелки

### Позиционирование лица
- Масштабирование по межзрачковому расстоянию (28% ширины овала)
- Позиция глаз: 40% от верха овала

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
