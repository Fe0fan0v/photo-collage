"""
Google Services Integration
Handles uploading to Google Drive and writing to Google Sheets

Drive uses OAuth2 user credentials (refresh token) because Service Accounts
no longer have storage quota on free Gmail accounts.
Sheets uses Service Account credentials.
"""

import os
import io
import json
from datetime import datetime
from typing import Optional, Dict

from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError


class GoogleServices:
    """Handles Google Drive and Google Sheets operations"""

    def __init__(self):
        self.sa_credentials = None
        self.drive_credentials = None
        self.drive_service = None
        self.sheets_service = None
        self.drive_folder_id = os.getenv('GOOGLE_DRIVE_FOLDER_ID', '')
        self.sheets_id = os.getenv('GOOGLE_SHEETS_ID', '')

        # Initialize services
        self._initialize_credentials()

    def _initialize_credentials(self):
        """Initialize Google API credentials"""
        # --- Service Account for Sheets ---
        credentials_path = os.getenv('GOOGLE_CREDENTIALS_PATH', 'credentials.json')

        if os.path.exists(credentials_path):
            try:
                self.sa_credentials = service_account.Credentials.from_service_account_file(
                    credentials_path,
                    scopes=['https://www.googleapis.com/auth/spreadsheets']
                )
                self.sheets_service = build('sheets', 'v4', credentials=self.sa_credentials)
                print("Google Sheets initialized (Service Account)")
            except Exception as e:
                print(f"Failed to initialize Sheets: {e}")
        else:
            print(f"Warning: Google credentials file not found at {credentials_path}")

        # --- OAuth2 user token for Drive ---
        oauth_token_path = os.getenv('GOOGLE_OAUTH_TOKEN_PATH', 'oauth_token.json')

        if os.path.exists(oauth_token_path):
            try:
                with open(oauth_token_path) as f:
                    token_data = json.load(f)

                self.drive_credentials = Credentials(
                    token=token_data.get('token'),
                    refresh_token=token_data.get('refresh_token'),
                    token_uri=token_data.get('token_uri', 'https://oauth2.googleapis.com/token'),
                    client_id=token_data.get('client_id'),
                    client_secret=token_data.get('client_secret'),
                    scopes=token_data.get('scopes', ['https://www.googleapis.com/auth/drive.file'])
                )

                # Refresh if expired
                if self.drive_credentials.expired or not self.drive_credentials.valid:
                    self.drive_credentials.refresh(Request())
                    # Save refreshed token
                    token_data['token'] = self.drive_credentials.token
                    with open(oauth_token_path, 'w') as f:
                        json.dump(token_data, f, indent=2)

                # Set quota project to avoid 403 with gcloud client ID
                self.drive_credentials = self.drive_credentials.with_quota_project('seletti-hybrid')

                self.drive_service = build('drive', 'v3', credentials=self.drive_credentials)
                print("Google Drive initialized (OAuth2 user token)")
            except Exception as e:
                print(f"Failed to initialize Drive OAuth2: {e}")
        else:
            print(f"Warning: OAuth token file not found at {oauth_token_path}")

        if self.sheets_service or self.drive_service:
            print("Google services initialized successfully")

    def is_configured(self) -> bool:
        """Check if at least one Google service is configured"""
        return self.is_drive_configured() or self.is_sheets_configured()

    def is_drive_configured(self) -> bool:
        """Check if Google Drive is configured"""
        return self.drive_service is not None and bool(self.drive_folder_id)

    def is_sheets_configured(self) -> bool:
        """Check if Google Sheets is configured"""
        return self.sheets_service is not None and bool(self.sheets_id)

    def upload_to_drive(self, image_bytes: bytes, filename: str) -> Optional[str]:
        """
        Upload image to Google Drive folder
        Returns public URL to the file or None if failed
        """
        if not self.is_drive_configured():
            print("Google Drive not configured")
            return None

        try:
            # Refresh OAuth token if needed
            if self.drive_credentials and (self.drive_credentials.expired or not self.drive_credentials.valid):
                self.drive_credentials.refresh(Request())
                self.drive_credentials = self.drive_credentials.with_quota_project('seletti-hybrid')
                self.drive_service = build('drive', 'v3', credentials=self.drive_credentials)

            # Create file metadata
            file_metadata = {
                'name': filename,
                'parents': [self.drive_folder_id],
                'mimeType': 'image/png'
            }

            # Create media upload
            media = MediaIoBaseUpload(
                io.BytesIO(image_bytes),
                mimetype='image/png',
                resumable=True
            )

            # Upload file
            file = self.drive_service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink, webContentLink'
            ).execute()

            file_id = file.get('id')

            # Make file publicly accessible
            self.drive_service.permissions().create(
                fileId=file_id,
                body={
                    'type': 'anyone',
                    'role': 'reader'
                }
            ).execute()

            # Get link to view image
            # Format: https://drive.google.com/file/d/FILE_ID/view
            public_url = f"https://drive.google.com/file/d/{file_id}/view"

            print(f"File uploaded to Google Drive: {public_url}")
            return public_url

        except HttpError as error:
            print(f"Error uploading to Google Drive: {error}")
            return None
        except Exception as e:
            print(f"Unexpected error uploading to Drive: {e}")
            return None

    def append_to_sheet(self, data: Dict) -> bool:
        """
        Append row to Google Sheet
        Expected data format:
        {
            'collage_id': int or str,
            'datetime': str,
            'email': str,
            'customer_type': str,
            'collage_url': str
        }
        """
        if not self.is_sheets_configured():
            print("Google Sheets not configured")
            return False

        try:
            # Prepare row data
            values = [[
                str(data.get('collage_id', '')),
                data.get('datetime', ''),
                data.get('email', ''),
                data.get('customer_type', ''),
                data.get('collage_url', '')
            ]]

            body = {
                'values': values
            }

            # Append to sheet
            result = self.sheets_service.spreadsheets().values().append(
                spreadsheetId=self.sheets_id,
                range='A:E',  # Columns A through E
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()

            print(f"Row appended to Google Sheets: {result.get('updates')}")
            return True

        except HttpError as error:
            print(f"Error writing to Google Sheets: {error}")
            return False
        except Exception as e:
            print(f"Unexpected error writing to Sheets: {e}")
            return False

    def get_next_collage_id(self) -> int:
        """
        Get next collage ID by counting rows in sheet
        Returns 1 if sheet is empty or on error
        """
        if not self.is_sheets_configured():
            return 1

        try:
            # Get all values from column A (IDs)
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.sheets_id,
                range='A:A'
            ).execute()

            values = result.get('values', [])

            # First row is header, so actual data rows = len(values) - 1
            # Next ID = number of data rows + 1
            return len(values) if len(values) > 0 else 1

        except Exception as e:
            print(f"Error getting next collage ID: {e}")
            return 1


# Global instance
google_services = GoogleServices()
