"""
Firebase Admin SDK initialization and authentication middleware for Django
"""
import os
import firebase_admin
from firebase_admin import credentials, auth
from rest_framework.response import Response
from rest_framework import status

# Initialize Firebase Admin SDK (only once)
_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK using service account credentials from environment"""
    global _initialized
    if _initialized:
        return
    
    # Get Firebase credentials from environment variable (JSON string)
    firebase_credentials = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    
    if firebase_credentials:
        # Parse JSON string from environment variable
        import json
        cred_dict = json.loads(firebase_credentials)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        _initialized = True
    else:
        # Fallback: try to load from file (for local development only)
        # In production, use environment variable
        try:
            cred = credentials.Certificate('firebase-service-account.json')
            firebase_admin.initialize_app(cred)
            _initialized = True
        except FileNotFoundError:
            # Don't raise error - allow app to start without Firebase (for backward compatibility)
            print("Warning: Firebase credentials not found. Firebase authentication will not work.")
            print("Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable to enable Firebase auth.")


def verify_firebase_token(token):
    """
    Verify Firebase ID token and return decoded token
    Returns None if token is invalid
    """
    try:
        initialize_firebase()
        if not _initialized:
            return None
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
        return None


def get_firebase_user(request):
    """
    Get Firebase user from request Authorization header
    Returns decoded token or None
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split('Bearer ')[1]
    return verify_firebase_token(token)
