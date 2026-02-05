# Инструкция по настройке Google Таблицы для сохранения коллажей

## Шаг 1: Создание Google Таблицы

1. **Создайте новую таблицу**
   - Перейдите на https://sheets.google.com
   - Нажмите "+ Создать" → "Google Таблицы"
   - Назовите таблицу, например: "Seletti Collages Database"

2. **Настройте заголовки столбцов**
   - В первой строке введите заголовки:
     - A1: `ID`
     - B1: `Дата и время`
     - C1: `Email`
     - D1: `Тип клиента`
     - E1: `Ссылка на коллаж`

3. **Скопируйте ID таблицы**
   - В адресной строке браузера найдите URL таблицы
   - Формат URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Скопируйте `SPREADSHEET_ID` (это длинная строка между `/d/` и `/edit`)
   - Пример: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
   - **Сохраните этот ID - он понадобится позже!**

---

## Шаг 2: Создание Google Apps Script Web App

1. **Откройте редактор скриптов**
   - В вашей Google Таблице нажмите "Расширения" → "Apps Script"
   - Откроется редактор кода

2. **Удалите код по умолчанию и вставьте следующий скрипт:**

```javascript
// ID вашей таблицы (будет получен автоматически)
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Функция для обработки POST-запросов
function doPost(e) {
  try {
    // Проверка безопасности (опционально)
    const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    const requestApiKey = e.parameter.api_key || '';

    if (apiKey && apiKey !== requestApiKey) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid API key'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Получение данных из запроса
    const collageId = e.parameter.collage_id || '';
    const datetime = e.parameter.datetime || new Date().toLocaleString('ru-RU');
    const email = e.parameter.email || '';
    const customerType = e.parameter.customer_type || '';
    const collageUrl = e.parameter.collage_url || '';

    // Открываем таблицу
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Если collageId не передан, генерируем его
    let finalId = collageId;
    if (!finalId) {
      const lastRow = sheet.getLastRow();
      finalId = lastRow > 1 ? lastRow : 1;
    }

    // Добавляем новую строку с данными
    sheet.appendRow([
      finalId,
      datetime,
      email,
      customerType,
      collageUrl
    ]);

    // Возвращаем успешный ответ
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      collage_id: finalId,
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Возвращаем ошибку
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Функция для тестирования
function testDoPost() {
  const testEvent = {
    parameter: {
      collage_id: '1',
      datetime: new Date().toLocaleString('ru-RU'),
      email: 'test@example.com',
      customer_type: 'Частный покупатель',
      collage_url: 'https://example.com/collage1.png'
    }
  };

  const result = doPost(testEvent);
  Logger.log(result.getContent());
}
```

3. **Сохраните скрипт**
   - Нажмите иконку дискеты или Ctrl+S
   - Назовите проект, например: "Collage Data API"

---

## Шаг 3: Развертывание Web App

1. **Разверните приложение**
   - Нажмите "Развернуть" → "Новое развертывание"
   - В поле "Тип" выберите "Веб-приложение"
   - Заполните параметры:
     - **Описание**: "Collage API v1"
     - **Запускать от имени**: "От моего имени (ваш email)"
     - **У кого есть доступ**: "Все" (или "Все пользователи Google", если хотите ограничить)

2. **Авторизуйте скрипт**
   - Нажмите "Развернуть"
   - Google попросит разрешение на доступ к таблице
   - Нажмите "Авторизовать доступ"
   - Выберите ваш аккаунт
   - Нажмите "Разрешить"

3. **Скопируйте URL веб-приложения**
   - После развертывания появится окно с **URL веб-приложения**
   - Формат: `https://script.google.com/macros/s/AKfycby.../exec`
   - **ВАЖНО: Скопируйте этот URL полностью!**
   - Это ваш `WEB_APP_URL` для отправки данных

---

## Шаг 4: Настройка API ключа (опционально, но рекомендуется)

Для безопасности рекомендуется создать API ключ:

1. **Сгенерируйте случайный ключ**
   - Используйте генератор паролей или создайте случайную строку
   - Пример: `sk_live_51234567890abcdef`

2. **Добавьте ключ в свойства скрипта**
   - В редакторе Apps Script нажмите "Настройки проекта" (шестеренка слева)
   - Перейдите на вкладку "Свойства скрипта"
   - Нажмите "Добавить свойство скрипта"
   - Имя: `API_KEY`
   - Значение: ваш сгенерированный ключ
   - Нажмите "Сохранить"

3. **Сохраните API ключ**
   - Этот ключ нужно будет передать разработчику

---

## Шаг 5: Тестирование

1. **Протестируйте скрипт**
   - В редакторе Apps Script выберите функцию `testDoPost` в выпадающем списке
   - Нажмите "Запустить"
   - Проверьте, что в таблице появилась новая строка с тестовыми данными

2. **Протестируйте через curl (опционально)**
   ```bash
   curl -L -X POST 'ВАШ_WEB_APP_URL' \
     -d 'collage_id=1' \
     -d 'datetime=2025-02-05 20:30:00' \
     -d 'email=test@example.com' \
     -d 'customer_type=Частный покупатель' \
     -d 'collage_url=https://example.com/test.png' \
     -d 'api_key=ВАШ_API_KEY'
   ```

---

## Что нужно передать разработчику

После выполнения всех шагов отправьте следующие данные:

```
GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/AKfycby.../exec
GOOGLE_SHEETS_API_KEY=sk_live_51234567890abcdef (если создали)
```

**ВАЖНО:**
- Web App URL должен заканчиваться на `/exec`
- Не путайте с URL для редактирования скрипта
- API ключ держите в секрете, не публикуйте его

---

## Настройка доступа к коллажам (для просмотра по ссылке)

Есть 2 варианта:

### Вариант 1: Хранение на сервере (рекомендуется)

Коллажи будут сохраняться на вашем сервере по адресу:
`https://collage.heliad.ru/uploads/YYYYMMDD_HHMMSS_random.png`

Ничего настраивать не нужно - работает автоматически.

### Вариант 2: Хранение в Google Drive (если нужно)

1. Создайте папку в Google Drive для коллажей
2. Откройте доступ: "Настройки доступа" → "Все, у кого есть ссылка, могут просматривать"
3. Скопируйте ID папки из URL
4. Передайте ID разработчику

---

## Устранение неполадок

**Проблема:** Ошибка "Authorization required"
- **Решение:** Повторите шаг авторизации при развертывании

**Проблема:** Данные не попадают в таблицу
- **Решение:**
  - Проверьте, что URL веб-приложения скопирован полностью
  - Убедитесь, что доступ настроен как "Все"
  - Запустите тестовую функцию `testDoPost`

**Проблема:** Ошибка "Invalid API key"
- **Решение:**
  - Проверьте, что API ключ указан правильно
  - Убедитесь, что свойство скрипта `API_KEY` создано

**Проблема:** Нужно обновить скрипт
- **Решение:**
  - Внесите изменения в код
  - Создайте новое развертывание: "Развернуть" → "Управление развертываниями" → "Изменить" → "Версия: Новая версия"

---

## Пример заполненной таблицы

| ID | Дата и время | Email | Тип клиента | Ссылка на коллаж |
|----|--------------|-------|-------------|------------------|
| 1 | 05.02.2026 20:30:45 | ivan@mail.ru | Частный покупатель | https://collage.heliad.ru/uploads/20260205_203045_abc123.png |
| 2 | 05.02.2026 20:35:12 | maria@yandex.ru | Дизайнер | https://collage.heliad.ru/uploads/20260205_203512_def456.png |
| 3 | 05.02.2026 20:42:03 | alex@gmail.com | Дилер | https://collage.heliad.ru/uploads/20260205_204203_ghi789.png |

---

## Дополнительные возможности

После настройки можно добавить:
- Автоматическую сортировку по дате
- Условное форматирование для разных типов клиентов
- Фильтры и сводные таблицы для аналитики
- Автоматические email-уведомления при новых записях

---

**Если возникнут проблемы, свяжитесь с разработчиком и укажите:**
1. Текст ошибки (если есть)
2. Скриншот настроек развертывания
3. Результат выполнения тестовой функции
