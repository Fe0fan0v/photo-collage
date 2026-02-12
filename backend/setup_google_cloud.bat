@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

echo ============================================================
echo   Настройка Google Cloud для Seletti Collage App
echo ============================================================
echo.

:: Проверка gcloud
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] gcloud CLI не найден.
    echo.
    echo Скачайте и установите Google Cloud SDK:
    echo https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
    echo.
    echo После установки перезапустите этот скрипт.
    echo.
    pause
    exit /b 1
)

echo [OK] gcloud CLI найден
echo.

:: Авторизация
echo [1/7] Авторизация в Google Cloud...
echo Откроется браузер для входа в Google аккаунт.
echo.
call gcloud auth login --no-launch-browser 2>nul || call gcloud auth login
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ошибка авторизации
    pause
    exit /b 1
)
echo.

:: Создание проекта
set PROJECT_ID=seletti-collage-%RANDOM%
echo [2/7] Создание проекта: %PROJECT_ID%
call gcloud projects create %PROJECT_ID% --name="Seletti Collage App"
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ошибка создания проекта. Возможно, нужно привязать billing account.
    set /p PROJECT_ID="Введите ID существующего проекта (или Enter для выхода): "
    if "!PROJECT_ID!"=="" exit /b 1
)

call gcloud config set project %PROJECT_ID%
echo.

:: Включение API
echo [3/7] Включение Google Sheets API...
call gcloud services enable sheets.googleapis.com
echo.

echo [4/7] Включение Google Drive API...
call gcloud services enable drive.googleapis.com
echo.

echo [5/7] Включение IAM API...
call gcloud services enable iam.googleapis.com
echo.

:: Создание Service Account
set SA_NAME=collage-service
set SA_EMAIL=%SA_NAME%@%PROJECT_ID%.iam.gserviceaccount.com

echo [6/7] Создание Service Account: %SA_NAME%
call gcloud iam service-accounts create %SA_NAME% --display-name="Collage Service Account" --description="Service account for Seletti Collage App"
echo.

:: Скачивание ключа
set KEY_FILE=%~dp0credentials.json
echo [7/7] Создание ключа: %KEY_FILE%
call gcloud iam service-accounts keys create "%KEY_FILE%" --iam-account=%SA_EMAIL%
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ошибка создания ключа
    pause
    exit /b 1
)
echo.

echo ============================================================
echo   Готово!
echo ============================================================
echo.
echo Service Account email:
echo   %SA_EMAIL%
echo.
echo Ключ сохранён:
echo   %KEY_FILE%
echo.
echo Проект: %PROJECT_ID%
echo.
echo ============================================================
echo   Следующие шаги:
echo ============================================================
echo.
echo 1. Запустите: python create_google_sheet.py
echo    (создаст таблицу и выдаст GOOGLE_SHEETS_ID)
echo.
echo 2. Создайте папку в Google Drive и расшарьте на:
echo    %SA_EMAIL%
echo.
echo 3. Добавьте в backend\.env:
echo    GOOGLE_CREDENTIALS_PATH=credentials.json
echo    GOOGLE_SHEETS_ID=...
echo    GOOGLE_DRIVE_FOLDER_ID=...
echo.
pause
