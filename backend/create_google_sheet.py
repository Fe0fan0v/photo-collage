"""
Скрипт для создания и настройки Google Таблицы для проекта Seletti Collage.

Использование:
    python create_google_sheet.py

Требования:
    - Файл credentials.json (Service Account ключ) в текущей директории
    - Установленные зависимости: google-auth, google-api-python-client

Результат:
    - Создаётся Google Таблица "Seletti Collages Database"
    - Настраиваются заголовки: ID, Дата и время, Email, Тип клиента, Ссылка на коллаж
    - Форматирование: жирные заголовки, ширина столбцов, закрепление первой строки
    - Выводится GOOGLE_SHEETS_ID для .env файла
"""

import os
import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
]

SPREADSHEET_TITLE = 'Seletti Collages Database'

HEADERS = ['ID', 'Дата и время', 'Email', 'Тип клиента', 'Ссылка на коллаж']

COLUMN_WIDTHS = [60, 180, 250, 180, 400]


def get_credentials(credentials_path: str):
    if not os.path.exists(credentials_path):
        print(f'Ошибка: файл {credentials_path} не найден.')
        print('Создайте Service Account и скачайте JSON ключ.')
        print('Инструкция: GOOGLE_SETUP_INSTRUCTIONS.md, Часть 2')
        sys.exit(1)

    return service_account.Credentials.from_service_account_file(
        credentials_path, scopes=SCOPES
    )


def create_spreadsheet(sheets_service, drive_service):
    """Создаёт таблицу с заголовками и форматированием."""

    spreadsheet_body = {
        'properties': {
            'title': SPREADSHEET_TITLE,
            'locale': 'ru_RU',
        },
        'sheets': [
            {
                'properties': {
                    'title': 'Коллажи',
                    'gridProperties': {
                        'frozenRowCount': 1,
                    },
                },
            }
        ],
    }

    spreadsheet = sheets_service.spreadsheets().create(
        body=spreadsheet_body
    ).execute()

    spreadsheet_id = spreadsheet['spreadsheetId']
    sheet_id = spreadsheet['sheets'][0]['properties']['sheetId']

    print(f'Таблица создана: {spreadsheet_id}')

    # Записать заголовки
    sheets_service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range='Коллажи!A1:E1',
        valueInputOption='RAW',
        body={'values': [HEADERS]},
    ).execute()

    # Форматирование
    requests = []

    # Жирные заголовки + фон
    requests.append({
        'repeatCell': {
            'range': {
                'sheetId': sheet_id,
                'startRowIndex': 0,
                'endRowIndex': 1,
                'startColumnIndex': 0,
                'endColumnIndex': 5,
            },
            'cell': {
                'userEnteredFormat': {
                    'textFormat': {'bold': True, 'fontSize': 11},
                    'backgroundColor': {
                        'red': 0.93,
                        'green': 0.93,
                        'blue': 0.93,
                    },
                    'horizontalAlignment': 'CENTER',
                    'verticalAlignment': 'MIDDLE',
                },
            },
            'fields': 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)',
        }
    })

    # Ширина столбцов
    for i, width in enumerate(COLUMN_WIDTHS):
        requests.append({
            'updateDimensionProperties': {
                'range': {
                    'sheetId': sheet_id,
                    'dimension': 'COLUMNS',
                    'startIndex': i,
                    'endIndex': i + 1,
                },
                'properties': {'pixelSize': width},
                'fields': 'pixelSize',
            }
        })

    # Высота строки заголовков
    requests.append({
        'updateDimensionProperties': {
            'range': {
                'sheetId': sheet_id,
                'dimension': 'ROWS',
                'startIndex': 0,
                'endIndex': 1,
            },
            'properties': {'pixelSize': 36},
            'fields': 'pixelSize',
        }
    })

    # Выравнивание столбца ID по центру (для данных)
    requests.append({
        'repeatCell': {
            'range': {
                'sheetId': sheet_id,
                'startRowIndex': 1,
                'endRowIndex': 1000,
                'startColumnIndex': 0,
                'endColumnIndex': 1,
            },
            'cell': {
                'userEnteredFormat': {
                    'horizontalAlignment': 'CENTER',
                },
            },
            'fields': 'userEnteredFormat.horizontalAlignment',
        }
    })

    # Валидация "Тип клиента" — выпадающий список
    requests.append({
        'setDataValidation': {
            'range': {
                'sheetId': sheet_id,
                'startRowIndex': 1,
                'endRowIndex': 1000,
                'startColumnIndex': 3,
                'endColumnIndex': 4,
            },
            'rule': {
                'condition': {
                    'type': 'ONE_OF_LIST',
                    'values': [
                        {'userEnteredValue': 'Частный покупатель'},
                        {'userEnteredValue': 'Дизайнер'},
                        {'userEnteredValue': 'Дилер'},
                        {'userEnteredValue': 'Поставщик'},
                    ],
                },
                'showCustomUi': True,
                'strict': False,
            },
        }
    })

    sheets_service.spreadsheets().batchUpdate(
        spreadsheetId=spreadsheet_id,
        body={'requests': requests},
    ).execute()

    print('Форматирование применено.')
    return spreadsheet_id


def share_spreadsheet(drive_service, spreadsheet_id, email: str):
    """Открывает доступ к таблице для указанного email."""
    drive_service.permissions().create(
        fileId=spreadsheet_id,
        body={
            'type': 'user',
            'role': 'writer',
            'emailAddress': email,
        },
        sendNotificationEmail=False,
    ).execute()
    print(f'Доступ предоставлен: {email}')


def main():
    credentials_path = os.getenv('GOOGLE_CREDENTIALS_PATH', 'credentials.json')
    credentials = get_credentials(credentials_path)

    sheets_service = build('sheets', 'v4', credentials=credentials)
    drive_service = build('drive', 'v3', credentials=credentials)

    spreadsheet_id = create_spreadsheet(sheets_service, drive_service)

    # Предложить расшарить таблицу
    print()
    email = input('Введите ваш Google email для доступа к таблице (или Enter для пропуска): ').strip()
    if email:
        try:
            share_spreadsheet(drive_service, spreadsheet_id, email)
        except Exception as e:
            print(f'Не удалось предоставить доступ: {e}')
            print('Вы можете вручную расшарить таблицу по ссылке ниже.')

    print()
    print('=' * 60)
    print('Таблица готова!')
    print('=' * 60)
    print()
    print(f'Ссылка: https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit')
    print()
    print('Добавьте в backend/.env:')
    print(f'GOOGLE_SHEETS_ID={spreadsheet_id}')
    print()


if __name__ == '__main__':
    main()
