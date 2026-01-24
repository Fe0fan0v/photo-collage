# Контекст работы: Фото-коллаж на тарелке

## Описание проекта
Веб-приложение для выставки: два участника делают фото, система удаляет фон, соединяет половинки лиц на декоративной тарелке.

## Серверы

| Сервис | URL | Порт |
|--------|-----|------|
| Frontend (Vite) | https://158.160.141.83:3007 | 3007 |
| Backend API (FastAPI) | https://158.160.141.83:3008 | 3008 |
| SSH | admin@158.160.141.83 | 22 |

**Репозиторий**: https://github.com/Fe0fan0v/photo-collage.git

## Структура проекта

```
photo-collage/
├── index.html
├── package.json
├── vite.config.js
├── certs/                    # SSL сертификаты
│   ├── cert.pem
│   └── key.pem
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
- OpenCV (haarcascade) - детекция лица
- HTTPS с самоподписанным сертификатом

## API Endpoints

### GET /health
Проверка состояния сервера
```json
{"status": "ok", "model_loaded": true}
```

### POST /process-face
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

1. Обработать оба фото через `/process-face`
2. Нарисовать зигзаг-паттерн фона
3. Нарисовать тарелку (круг 900px)
4. Нарисовать лица в овале (500x620px):
   - Оба лица масштабируются до одинаковой высоты
   - Выравнивание по верхнему краю (линия лба)
   - Левая половина от фото 1, правая от фото 2
5. Нарисовать разделительную линию

## Команды для запуска

```bash
# SSH на сервер
ssh admin@158.160.141.83

# Frontend
cd ~/photo-collage
npm run dev

# Backend
cd ~/photo-collage/backend
source venv/bin/activate
python main.py

# Проверить процессы
pgrep -f vite
pgrep -f 'python main.py'

# Логи
cat ~/vite.log
cat ~/backend.log
```

## Что сделано

- [x] Frontend с экранами (welcome, camera, plate-selection, processing, success)
- [x] HTTPS для работы камеры на мобильных
- [x] Python backend с rembg для удаления фона
- [x] Детекция лица через OpenCV
- [x] Овальная маска для лиц
- [x] Выравнивание половинок по верхнему краю лица
- [x] Масштабирование обоих лиц до одинаковой высоты

## Что нужно доработать

- [ ] Улучшить точность совмещения лиц (иногда криво)
- [ ] Email отправка через EmailJS
- [ ] Сохранение email в Google Sheets
- [ ] Возможно: ручная корректировка позиции лица пользователем

## Известные проблемы

1. **Совмещение лиц** - иногда работает криво, нужно улучшить алгоритм выравнивания
2. **Детекция лица** - haarcascade может не найти лицо при плохом освещении или угле

## Последние изменения

- Переход с клиентской библиотеки @imgly/background-removal на серверный rembg (быстрее загрузка)
- Добавлена детекция лица для точного позиционирования
- Овальная маска вместо круглой
- Выравнивание по верхнему краю лица (лоб)
