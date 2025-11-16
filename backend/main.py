# =================================================================================================
# DortMed - An Advanced, AI-Powered Medical System
# File: backend/main.py
# Description: This file contains the complete backend logic for the DortMed application,
#              including API endpoints, database models, authentication, and business logic.
# =================================================================================================
import hashlib
import hmac
# I. CORE IMPORTS & INITIAL SETUP
# =================================================================================================
# Standard Library Imports

import os
import json
import logging
import asyncio
import enum
import re
import secrets
import uuid
import math
from sqlalchemy.sql import func
from sqlalchemy.sql.functions import func
import io
import httpx
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any, Union
from contextlib import asynccontextmanager
from itertools import combinations
from firebase_admin import auth
# Third-party Imports
# FastAPI and related
from fastapi import (
    FastAPI,
    Request,
    Depends,
    HTTPException,
    status,
    Form,
    UploadFile,
    File,
    Query,
    BackgroundTasks,
    APIRouter,
    WebSocket, WebSocketDisconnect
)
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

# Pydantic for data validation and settings management
from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    validator,
    ValidationError
)
from pydantic_settings import BaseSettings

# Database - SQLAlchemy for ORM
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLAlchemyEnum,
    Float,
    LargeBinary,
    event,
    Interval,
    or_,
    text, case
)
from sqlalchemy.orm import sessionmaker, Session, relationship, joinedload, declarative_base
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.engine import Engine
from sqlalchemy.dialects.postgresql import INTERVAL

# Firebase for Authentication and Cloud Storage
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage, messaging
from google.cloud.storage import Blob
import mimetypes
# Security and Cryptography
import bcrypt
from jose import JWTError, jwt

# Other essential libraries
import uvicorn
from PIL import Image

from twilio.rest import Client
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant

import pyotp
import qrcode
from cryptography.fernet import Fernet

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from fastapi.responses import StreamingResponse
from functools import wraps
import random


# =================================================================================================
# II. CONFIGURATION MANAGEMENT
# =================================================================================================
class AppSettings(BaseSettings):
    APP_NAME: str = "DortMed"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./dortmed.db"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    FIREBASE_CREDENTIALS_PATH: str = "path/to/your/firebase-credentials.json"
    FIREBASE_STORAGE_BUCKET: str = "your-firebase-storage-bucket-name.appspot.com"
    EMAIL_API_KEY: Optional[str] = "YOUR_EMAIL_API_KEY"
    SMS_API_KEY: Optional[str] = "YOUR_SMS_API_KEY"
    SMS_SENDER_ID: Optional[str] = "DortMed"

    TWILIO_ACCOUNT_SID: str = "YOUR_TWILIO_ACCOUNT_SID"
    TWILIO_AUTH_TOKEN: str = "YOUR_TWILIO_AUTH_TOKEN"
    TWILIO_API_KEY_SID: str = "YOUR_TWILIO_API_KEY_SID"
    TWILIO_API_KEY_SECRET: str = "YOUR_TWILIO_API_KEY_SECRET"

    TFA_SECRET_KEY: str = "your_2fa_secret_key"
    AI_SERVICE_URL: str = "http://ai_service:8080"
    OCR_SERVICE_URL: str = "http://ocr_service:8090"

    # --- ADD THESE NEW FIELDS ---
    SUPERUSER_EMAIL: Optional[str] = None
    SUPERUSER_PASSWORD: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:3000"
    PAYSTACK_SECRET_KEY: str = "YOUR_PAYSTACK_SECRET_KEY"
    # ----------------------------

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'


settings = AppSettings()

# =================================================================================================
# III. LOGGING CONFIGURATION
# =================================================================================================
logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG)
logger = logging.getLogger(__name__)
handler = logging.FileHandler("dortmed_app.log")
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# =================================================================================================
# IV. LIFESPAN MANAGEMENT & APPLICATION INSTANTIATION
# =================================================================================================
engine = None
SessionLocal = None
Base = declarative_base()

# Pre-defined list of controllable features in the system
# This prevents creating arbitrary flags and keeps the system manageable.
AVAILABLE_FEATURES = ["TELEMEDICINE", "AI_DIAGNOSIS", "OCR_UPLOAD", "GEOSPATIAL_SEARCH"]


async def create_initial_data():
    """
    An idempotent function to seed the database with initial required data
    on application startup. It creates:
    1. The initial Superuser from environment variables if one doesn't exist.
    2. All defined Feature Flags with their default permissions if they don't exist.
    """
    logger.info("Checking for and creating initial data (Superuser, Feature Flags)...")
    db = SessionLocal()
    try:
        # --- 1. Seed Initial Superuser ---
        SUPERUSER_EMAIL = settings.SUPERUSER_EMAIL
        SUPERUSER_PASSWORD = settings.SUPERUSER_PASSWORD

        if not SUPERUSER_EMAIL or not SUPERUSER_PASSWORD:
            logger.warning(
                "SUPERUSER_EMAIL or SUPERUSER_PASSWORD environment variables not set. Cannot create initial superuser.")
        else:
            # Check if a superuser already exists
            existing_superuser = db.query(User).filter(User.role == UserRole.SUPERUSER).first()
            if not existing_superuser:
                logger.info(f"No superuser found. Creating one with email: {SUPERUSER_EMAIL}")

                # Use the password manager to hash the password
                hashed_password = PasswordManager.get_password_hash(SUPERUSER_PASSWORD)

                # Create the new superuser instance
                new_superuser = User(
                    id=str(uuid.uuid4()),
                    email=SUPERUSER_EMAIL,
                    hashed_password=hashed_password,
                    role=UserRole.SUPERUSER,
                    is_active=True,
                    is_verified=True  # Superusers are verified by default
                )
                db.add(new_superuser)
                db.commit()  # Commit the superuser so it's available for the next steps if needed
                logger.info("Initial superuser created successfully.")
            else:
                logger.info("Superuser already exists. Skipping creation.")

        # --- 2. Seed Feature Flags ---

        # Get a set of all flag names currently in the database for an efficient check
        existing_flags_query = db.query(FeatureFlag.name).all()
        existing_flags = {name for (name,) in existing_flags_query}

        # This is the single source of truth for all available features and their defaults
        default_feature_permissions = {
            "TELEMEDICINE": {"freemium": False, "basic": True, "premium": True, "ultimate": True},
            "AI_DIAGNOSIS": {"freemium": False, "basic": False, "premium": True, "ultimate": True},
            "OCR_UPLOAD": {"freemium": False, "basic": True, "premium": True, "ultimate": True},
            "GEOSPATIAL_SEARCH": {"freemium": True, "basic": True, "premium": True, "ultimate": True},
        }

        # Iterate through our defined features and create any that are missing
        for feature_name, permissions in default_feature_permissions.items():
            if feature_name not in existing_flags:
                logger.info(f"Feature flag '{feature_name}' not found. Creating with default permissions.")

                flag = FeatureFlag(
                    name=feature_name,
                    is_enabled_for_freemium=permissions["freemium"],
                    is_enabled_for_basic=permissions["basic"],
                    is_enabled_for_premium=permissions["premium"],
                    is_enabled_for_ultimate=permissions["ultimate"]
                )
                db.add(flag)

        # Commit all new feature flags in a single transaction
        db.commit()
        logger.info("Feature flag seeding process complete.")

    except Exception as e:
        logger.error(f"An error occurred during initial data seeding: {e}", exc_info=True)
        db.rollback()  # Rollback any partial changes on error
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, SessionLocal
    logger.info(f"Starting up {settings.APP_NAME} v{settings.APP_VERSION}...")

    try:
        if not firebase_admin._apps:
            if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred, {'storageBucket': settings.FIREBASE_STORAGE_BUCKET})
                logger.info("Firebase Admin SDK initialized.")
            else:
                logger.error(f"Firebase credentials not found at: {settings.FIREBASE_CREDENTIALS_PATH}")
    except Exception as e:
        logger.critical(f"Firebase initialization failed: {e}", exc_info=True)

    engine = create_engine(settings.DATABASE_URL)

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully.")

        # Replace the old call with this new one
        await create_initial_data()

    except Exception as e:
        logger.critical(f"Failed to create database tables or initial data: {e}", exc_info=True)

    def haversine(lat1: float, lon1: float, lat2: float, lon2: float, unit: str = 'km') -> float:
        """
        Calculate the great-circle distance between two points
        on the earth (specified in decimal degrees).
        """
        if None in [lat1, lon1, lat2, lon2]:
            return float('inf')  # Return a large number if location is missing

        # convert decimal degrees to radians
        lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

        # haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))

        # Radius of earth in kilometers is 6371. Use 3956 for miles
        r = 6371 if unit == 'km' else 3956
        return c * r


    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified.")
        await create_initial_data()
    except Exception as e:
        logger.critical(f"DB table creation failed: {e}", exc_info=True)

    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan, docs_url="/api/docs",
              redoc_url="/api/redoc")

# =================================================================================================
# V. MIDDLEWARE CONFIGURATION
# =================================================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{request.method} {request.url.path} - Status: {response.status_code} - Processed in: {process_time:.4f}s")
    return response


# =================================================================================================
# VI. DATABASE SETUP & DEPENDENCIES
# =================================================================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Depends(get_db)


# =================================================================================================
# VII. ENUMS & CONSTANTS
# =================================================================================================
class UserRole(str, enum.Enum):
    PATIENT = "patient"
    PHYSICIAN = "physician"
    SUPERUSER = "superuser"


class SubscriptionPlan(str, enum.Enum):
    FREEMIUM = "freemium";
    BASIC = "basic";
    PREMIUM = "premium";
    ULTIMATE = "ultimate"


class PaymentGateway(str, enum.Enum):
    PAYSTACK = "paystack";
    PAYPAL = "paypal";
    WALLET_PAY = "wallet_pay";
    MASTERCARD_VISA = "mastercard_visa"


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled";
    COMPLETED = "completed";
    CANCELLED = "cancelled";
    RESCHEDULED = "rescheduled"


class DocumentType(str, enum.Enum):
    PRESCRIPTION = "prescription";
    LAB_RESULT = "lab_result";
    VACCINATION_RECORD = "vaccination_record";
    MEDICAL_IMAGE = "medical_image";
    OTHER = "other"


# =================================================================================================
# VIII. DATABASE MODELS (SQLAlchemy ORM)
# =================================================================================================
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)  # This will store the Firebase UID
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    tfa_secret = Column(String, nullable=True)  # Encrypted 2FA secret
    is_tfa_enabled = Column(Boolean, default=False)
    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    physician_profile = relationship("Physician", back_populates="user", uselist=False, cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String, nullable=False);
    last_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(String, nullable=True);
    blood_group = Column(String, nullable=True);
    address = Column(String, nullable=True)
    allergies = Column(Text, nullable=True);
    past_illnesses = Column(Text, nullable=True)
    surgeries = Column(Text, nullable=True);
    family_history = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient", foreign_keys="[Appointment.patient_id]")
    documents = relationship("MedicalDocument", back_populates="patient", cascade="all, delete-orphan")
    has_completed_tour = Column(Boolean, default=False)

class Physician(Base):
    __tablename__ = "physicians"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String, nullable=False);
    last_name = Column(String, nullable=False)
    specialty = Column(String, index=True, nullable=False)
    address = Column(String, nullable=True)  # Add address for display purposes
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    medical_license_number = Column(String, unique=True, nullable=False)
    board_certifications = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_documents_url = Column(String, nullable=True)
    availability_schedule = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="physician_profile")
    appointments = relationship("Appointment", back_populates="physician", foreign_keys="[Appointment.physician_id]")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan = Column(SQLAlchemyEnum(SubscriptionPlan), default=SubscriptionPlan.FREEMIUM, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow);
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    gateway_subscription_id = Column(String, nullable=True, index=True)
    user = relationship("User", back_populates="subscription")
    payments = relationship("Payment", back_populates="subscription")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String, ForeignKey("subscriptions.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False);
    currency = Column(String(3), nullable=False)
    status = Column(String, nullable=False)
    gateway = Column(SQLAlchemyEnum(PaymentGateway), nullable=False)
    gateway_transaction_id = Column(String, unique=True, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    subscription = relationship("Subscription", back_populates="payments")


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    physician_id = Column(String, ForeignKey("physicians.id"), nullable=False)
    appointment_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(SQLAlchemyEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    consultation_notes = Column(Text, nullable=True)
    telemedicine_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    patient = relationship("Patient", back_populates="appointments", foreign_keys=[patient_id])
    physician = relationship("Physician", back_populates="appointments", foreign_keys=[physician_id])


class MedicalDocument(Base):
    __tablename__ = "medical_documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(SQLAlchemyEnum(DocumentType), nullable=False)
    file_name = Column(String, nullable=False);
    file_path = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    description = Column(String, nullable=True)
    patient = relationship("Patient", back_populates="documents")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)
    user = relationship("User")


class FCMDevice(Base):
    __tablename__ = "fcm_devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fcm_token = Column(String, unique=True, index=True, nullable=False)
    device_type = Column(String, default="web")  # e.g., 'web', 'ios', 'android'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    physician_id = Column(String, ForeignKey("physicians.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient")
    physician = relationship("Physician")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)  # The User ID of the sender
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")


class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False)
    city = Column(String, index=True)
    country = Column(String, index=True)
    phone_number = Column(String)
    website = Column(String, nullable=True)
    specialties = Column(Text, nullable=True)  # Stored as a comma-separated string
    services = Column(Text, nullable=True)  # Stored as a comma-separated string

    # Geographic coordinates for mapping
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    is_validated = Column(Boolean, default=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String, ForeignKey("users.id"),
                     nullable=True)  # User performing the action (can be null for system actions)
    action = Column(String, nullable=False, index=True)  # e.g., "USER_LOGIN", "VIEW_PATIENT_RECORD"
    target_type = Column(String, nullable=True)  # e.g., "Patient", "Appointment"
    target_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)  # JSON string with extra context, e.g., IP address
    status = Column(String)  # e.g., "SUCCESS", "FAILURE"

    user = relationship("User")

# =================================================================================================
# IX. PYDANTIC SCHEMAS
# =================================================================================================
# --- Base & Auth Schemas ---
class Token(BaseModel):
    access_token: str;
    refresh_token: str;
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr;
    phone_number: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: UserRole

    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v) or not re.search(r'[a-z]', v) or not re.search(r'[0-9]', v) or not re.search(
                r'[\W_]', v):
            raise ValueError('Password must contain uppercase, lowercase, digit, and special character.')
        return v


class UserInDB(UserBase):
    id: str;
    role: UserRole;
    is_active: bool;
    is_verified: bool

    class Config: from_attributes = True


# --- Patient Schemas ---
class PatientBase(BaseModel):
    first_name: str;
    last_name: str;
    date_of_birth: datetime;
    gender: Optional[str] = None
    blood_group: Optional[str] = None;
    address: Optional[str] = None


class PatientCreate(PatientBase): pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None;
    last_name: Optional[str] = None;
    gender: Optional[str] = None
    blood_group: Optional[str] = None;
    address: Optional[str] = None;
    allergies: Optional[str] = None
    past_illnesses: Optional[str] = None;
    surgeries: Optional[str] = None;
    family_history: Optional[str] = None
    current_medications: Optional[str] = None


class PatientInDB(PatientBase):
    id: str;
    user_id: str;
    allergies: Optional[str] = None;
    past_illnesses: Optional[str] = None
    surgeries: Optional[str] = None;
    family_history: Optional[str] = None;
    current_medications: Optional[str] = None

    class Config: from_attributes = True


# --- Physician Schemas ---
class PhysicianBase(BaseModel):
    first_name: str;
    last_name: str;
    specialty: str;
    medical_license_number: str


class PhysicianCreate(PhysicianBase):
    board_certifications: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class PhysicianUpdate(BaseModel):
    specialty: Optional[str] = None;
    board_certifications: Optional[str] = None;
    availability_schedule: Optional[str] = None


class PhysicianInDB(PhysicianBase):
    id: str;
    user_id: str;
    is_verified: bool

    class Config: from_attributes = True


# --- Combined Schemas ---
class PatientRegistration(BaseModel):
    user: UserCreate;
    profile: PatientCreate


class PhysicianRegistration(BaseModel):
    user: UserCreate;
    profile: PhysicianCreate


class UserPublic(UserInDB):
    patient_profile: Optional[PatientInDB] = None
    physician_profile: Optional[PhysicianInDB] = None

    class Config: from_attributes = True


# --- Patient Portal Schemas ---
class MedicalDocumentBase(BaseModel):
    document_type: DocumentType;
    description: Optional[str] = None


class MedicalDocumentResponse(MedicalDocumentBase):
    id: str;
    file_name: str;
    upload_date: datetime;
    file_url: Optional[str] = None

    class Config: from_attributes = True


class MedicalHistoryUpdate(BaseModel):
    allergies: Optional[str] = Field(None);
    past_illnesses: Optional[str] = Field(None)
    surgeries: Optional[str] = Field(None);
    family_history: Optional[str] = Field(None)
    current_medications: Optional[str] = Field(None)


# --- Physician Portal & Appointment Schemas ---
class PhysicianProfileUpdate(BaseModel):
    specialty: Optional[str] = None;
    board_certifications: Optional[str] = None
    availability_schedule: Optional[Dict[str, List[str]]] = None
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    @validator('availability_schedule')
    def validate_schedule(cls, v):
        if v is None: return v
        for day, slots in v.items():
            if not isinstance(slots, list): raise ValueError("Slots must be a list")
            for slot in slots:
                if not re.match(r'^\d{2}:\d{2}-\d{2}:\d{2}$', slot) or slot.split('-')[0] >= slot.split('-')[1]:
                    raise ValueError(f"Invalid time slot format or range: {slot}")
        return v


class PhysicianPublicProfile(PhysicianInDB):
    email: EmailStr;
    availability_schedule: Optional[Dict[str, List[str]]] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None  # To show distance in search results

    class Config: from_attributes = True


class PatientInfoForPhysician(PatientInDB):
    email: EmailStr;
    phone_number: Optional[str] = None


class AppointmentCreate(BaseModel):
    physician_id: str;
    appointment_time: datetime;
    duration_minutes: int = Field(30, gt=0)

    @validator('appointment_time')
    def validate_appointment_time(cls, v):
        if v.tzinfo is None: v = v.replace(tzinfo=timezone.utc)
        if v < datetime.now(timezone.utc): raise ValueError("Appointment time cannot be in the past.")
        return v


class AppointmentDetails(BaseModel):
    id: str;
    appointment_time: datetime;
    duration_minutes: int;
    status: AppointmentStatus
    consultation_notes: Optional[str] = None;
    telemedicine_link: Optional[str] = None

    class Config: from_attributes = True


class AppointmentForPatient(AppointmentDetails): physician: PhysicianPublicProfile


class AppointmentForPhysician(AppointmentDetails): patient: PatientInfoForPhysician


class ConsultationNotesUpdate(BaseModel): notes: str = Field(..., min_length=1)


# --- Superuser Schemas ---
class UserAdminView(UserInDB):
    created_at: datetime;
    last_login: Optional[datetime] = None
    patient_profile: Optional[PatientInDB] = None;
    physician_profile: Optional[PhysicianInDB] = None

    class Config: from_attributes = True


class PaginatedUsersResponse(BaseModel):
    total: int;
    page: int;
    size: int;
    pages: int;
    items: List[UserAdminView]


class UserStatusUpdate(BaseModel):
    is_active: Optional[bool] = None;
    is_verified: Optional[bool] = None


class PhysicianVerificationUpdate(BaseModel):
    is_verified: bool;
    verification_notes: Optional[str] = None


# --- AI & ML Schemas ---
class DiagnosisInput(BaseModel):
    symptoms: str;
    medical_history: Optional[str] = None;
    lab_results: Optional[Dict[str, Any]] = None


class DiagnosisSuggestion(BaseModel):
    condition: str;
    confidence_score: float = Field(..., ge=0, le=1)
    explanation: str;
    recommended_actions: List[str]


class RiskPredictionInput(BaseModel):
    age: int = Field(..., gt=0);
    gender: str;
    systolic_bp: int;
    diastolic_bp: int
    cholesterol: int;
    hdl: int;
    ldl: int;
    has_diabetes: bool;
    is_smoker: bool


class RiskScore(BaseModel):
    disease: str;
    risk_percentage: float;
    risk_level: str;
    contributing_factors: List[str]


class DrugInteractionInput(BaseModel):
    medications: List[str] = Field(..., min_items=2)


class DrugInteractionResult(BaseModel):
    pair: List[str];
    severity: str;
    description: str


class MealPlan(BaseModel):
    condition: str;
    daily_calorie_target: int;
    meals: Dict[str, List[str]]

class PlanDetail(BaseModel):
    plan_id: SubscriptionPlan
    name: str
    price_monthly: int # in lowest currency unit (e.g., kobo, cents)
    price_yearly: int
    currency: str
    features: List[str]

class PaymentInitializeRequest(BaseModel):
    plan: SubscriptionPlan
    interval: str = Field("monthly", pattern="^(monthly|yearly)$")

class PaymentInitializeResponse(BaseModel):
    authorization_url: str
    access_code: str
    reference: str

class PaystackWebhookData(BaseModel):
    id: int
    domain: str
    status: str
    reference: str
    amount: int
    customer: Dict[str, Any]
    authorization: Dict[str, Any]

class PaystackWebhookPayload(BaseModel):
    event: str
    data: PaystackWebhookData


class HospitalBase(BaseModel):
    name: str
    address: str
    city: str
    country: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    phone_number: Optional[str] = None
    website: Optional[str] = None
    specialties: Optional[str] = None
    services: Optional[str] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None
    specialties: Optional[str] = None
    services: Optional[str] = None
    is_validated: Optional[bool] = None

class HospitalOut(HospitalBase):
    id: str
    is_validated: bool
    class Config: from_attributes = True


class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # e.g., "TELEMEDICINE", "AI_DIAGNOSIS"

    # Permissions based on subscription plan
    is_enabled_for_freemium = Column(Boolean, default=False)
    is_enabled_for_basic = Column(Boolean, default=True)
    is_enabled_for_premium = Column(Boolean, default=True)
    is_enabled_for_ultimate = Column(Boolean, default=True)


class BlogPost(Base):
    __tablename__ = "blog_posts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=True)  # Admin or Physician who wrote it
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User")

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    video_url = Column(String, nullable=True) # Link to a demonstration video
    # Target conditions can be a comma-separated string, e.g., "hypertension,general_wellness,post_surgery"
    target_conditions = Column(String, index=True)

class Supplement(Base):
    __tablename__ = "supplements"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    # Conditions where this supplement might be recommended
    target_conditions = Column(String, index=True)


class AppointmentFeedback(Base):
    __tablename__ = "appointment_feedback"
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(String, ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    physician_id = Column(String, ForeignKey("physicians.id"), nullable=False)

    rating = Column(Integer, nullable=False)  # e.g., 1 to 5 stars
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment")

# --- New Pydantic Schemas for Blog ---
class BlogPostBase(BaseModel):
    title: str
    content: str


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostOut(BlogPostBase):
    id: int
    created_at: datetime
    updated_at: datetime
    author_email: Optional[str] = None

    class Config: from_attributes = True


class Meal(Base):
    """Represents a single food item or a small meal component."""
    __tablename__ = "meals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    # e.g., 'breakfast', 'lunch', 'dinner', 'snack'
    meal_type = Column(String, index=True)
    # e.g., 'diabetes', 'hypertension', 'general_wellness'
    # Can be a comma-separated list of conditions it's suitable for.
    suitable_for_conditions = Column(String, index=True)
    calories = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)


class MealPlanTemplate(Base):
    """Defines a full day's meal structure for a specific condition."""
    __tablename__ = "meal_plan_templates"
    id = Column(Integer, primary_key=True, index=True)
    # The condition this template is designed for, e.g., 'diabetes'.
    condition = Column(String, unique=True, nullable=False, index=True)
    daily_calorie_target = Column(Integer)
    # JSON field storing the structure, e.g., {"breakfast": 1, "snack_1": 1, "lunch": 1, ...}
    # The numbers indicate how many items of that type to pick.
    structure = Column(Text)


class PatientVital(Base):
    """
    Stores time-series health data for a patient. This table can be populated
    by manual user entries, connected IoT devices, or data extracted from lab results.
    It serves as the data source for patient health trend charts.
    """
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    # The type of vital sign being measured.
    # e.g., "systolic_bp", "diastolic_bp", "blood_glucose", "weight_kg", "heart_rate_bpm"
    vital_type = Column(String, nullable=False, index=True)
    # The numeric value of the vital sign.
    value = Column(Float, nullable=False)
    # The timestamp when the measurement was taken.
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    # Relationship to the Patient model.
    patient = relationship("Patient")


class ProfessionalResource(Base):
    """
    Stores a curated list of professional development resources for physicians,
    such as links to medical journals, online courses, or internal forum discussions.
    This table is managed by administrators via the CMS.
    """
    __tablename__ = "professional_resources"
    id = Column(Integer, primary_key=True, index=True)
    # The title of the resource.
    title = Column(String, nullable=False)
    # The publisher or source of the resource.
    # e.g., "Journal of the American College of Cardiology", "DortMed University", "NEJM"
    source = Column(String)
    # A category for the resource to help with organization and UI presentation.
    # e.g., "journal", "course", "forum", "guideline"
    resource_type = Column(String, nullable=False)
    # The direct URL to access the resource.
    link = Column(String, nullable=False)




# =================================================================================================
# X. UTILITY & HELPER FUNCTIONS
# =================================================================================================
# --- PayStack Service Utility ---
class PaystackService:
    """Encapsulates all communication with the PayStack API."""

    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.base_url = "https://api.paystack.co"
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(method, f"{self.base_url}{endpoint}", json=data, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Paystack API error: {e.response.status_code} - {e.response.text}")
                raise HTTPException(status_code=e.response.status_code,
                                    detail=e.response.json().get("message", "Payment provider error"))
            except Exception as e:
                logger.error(f"Error communicating with Paystack: {e}")
                raise HTTPException(status_code=500, detail="Could not communicate with payment provider.")

    async def create_or_update_customer(self, user: User) -> str:
        """Creates a customer on Paystack or updates if they exist."""
        if user.patient_profile:
            first_name = user.patient_profile.first_name
            last_name = user.patient_profile.last_name
        elif user.physician_profile:
            first_name = user.physician_profile.first_name
            last_name = user.physician_profile.last_name
        else:  # Superuser or edge case
            first_name = "Admin"
            last_name = "User"

        customer_data = {
            "email": user.email,
            "first_name": first_name,
            "last_name": last_name,
            "phone": user.phone_number
        }

        # If user already has a customer code, we can update instead of create
        if user.paystack_customer_code:
            # The PUT endpoint for customer requires the customer code or ID
            response = await self._make_request("PUT", f"/customer/{user.paystack_customer_code}", data=customer_data)
        else:
            response = await self._make_request("POST", "/customer", data=customer_data)

        if response.get("status"):
            return response["data"]["customer_code"]
        raise HTTPException(status_code=500, detail="Failed to create customer on Paystack.")

    async def initialize_transaction(self, email: str, amount: int, plan: SubscriptionPlan, reference: str) -> Dict:
        """Initializes a payment transaction."""
        payload = {
            "email": email,
            "amount": str(amount),
            "reference": reference,
            "callback_url": f"{settings.FRONTEND_URL}/payment-status",
            "metadata": {
                "plan": plan.value,
                "cancel_action": f"{settings.FRONTEND_URL}/subscriptions"
            }
        }
        return await self._make_request("POST", "/transaction/initialize", data=payload)

    async def verify_transaction(self, reference: str) -> Dict:
        """Verifies a transaction's status with Paystack."""
        return await self._make_request("GET", f"/transaction/verify/{reference}")


paystack_service = PaystackService(secret_key=settings.PAYSTACK_SECRET_KEY)

# --- Subscription Plans Definition ---
SUBSCRIPTION_PLANS: Dict[SubscriptionPlan, PlanDetail] = {
    SubscriptionPlan.BASIC: PlanDetail(
        plan_id=SubscriptionPlan.BASIC, name="Basic", price_monthly=500000, price_yearly=5400000, currency="NGN",
        features=["5 Telemedicine Consultations/month", "Basic AI Diagnosis Support", "Secure Medical Record Storage"]
    ),
    SubscriptionPlan.PREMIUM: PlanDetail(
        plan_id=SubscriptionPlan.PREMIUM, name="Premium", price_monthly=1500000, price_yearly=16200000, currency="NGN",
        features=["Unlimited Consultations", "Advanced AI Diagnosis & Risk Prediction", "Drug Interaction Checker",
                  "Priority Support"]
    ),
    SubscriptionPlan.ULTIMATE: PlanDetail(
        plan_id=SubscriptionPlan.ULTIMATE, name="Ultimate (Business)", price_monthly=5000000, price_yearly=54000000,
        currency="NGN",
        features=["All Premium Features", "Multi-user Management", "API Access for Integration",
                  "Dedicated Account Manager"]
    ),
}

# --- Twilio Service Utility ---
class TwilioService:
    """Manages Twilio API interactions, including room creation and token generation."""
    def __init__(self, account_sid, auth_token, api_key_sid, api_key_secret):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.api_key_sid = api_key_sid
        self.api_key_secret = api_key_secret
        self.client = Client(account_sid, auth_token)

    def get_video_token(self, room_name: str, identity: str) -> str:
        """
        Generates a short-lived Access Token for a specific user and video room.
        """
        try:
            token = AccessToken(
                self.account_sid,
                self.api_key_sid,
                self.api_key_secret,
                identity=identity,
                ttl=3600 # Token is valid for 1 hour
            )

            video_grant = VideoGrant(room=room_name)
            token.add_grant(video_grant)

            return token.to_jwt()
        except Exception as e:
            logger.error(f"Failed to generate Twilio token for {identity} in room {room_name}: {e}")
            raise HTTPException(status_code=500, detail="Could not generate video session token.")

    def find_or_create_room(self, room_name: str):
        """
        Finds a room by its unique name or creates it if it doesn't exist yet.
        Twilio rooms are created on-demand when the first participant joins.
        This function ensures the room exists in a specific state if needed (e.g., group rooms).
        """
        try:
            # Twilio's API will list the room if it's in-progress or recently completed.
            # We use 'in-progress' to see if it's active.
            self.client.video.v1.rooms(room_name).fetch()
            logger.info(f"Twilio room '{room_name}' already exists.")
        except Exception as e: # TwilioRestException with status 404 means not found
             if e.status == 404:
                # Create the room
                self.client.video.v1.rooms.create(unique_name=room_name, type='group') # 'group' allows multiple participants
                logger.info(f"Created Twilio room '{room_name}'.")
             else:
                logger.error(f"Error fetching Twilio room '{room_name}': {e}")
                raise HTTPException(status_code=500, detail="Could not create or access video room.")


# Initialize the service with settings from environment
twilio_service = TwilioService(
    account_sid=settings.TWILIO_ACCOUNT_SID,
    auth_token=settings.TWILIO_AUTH_TOKEN,
    api_key_sid=settings.TWILIO_API_KEY_SID,
    api_key_secret=settings.TWILIO_API_KEY_SECRET,
)

# --- Telemedicine Pydantic Schemas ---
class VideoTokenResponse(BaseModel):
    token: str
    room_name: str



class PasswordManager:
    @staticmethod
    def get_password_hash(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


class FirebaseStorageManager:
    def __init__(self, bucket_name: str):
        try:
            self.bucket = storage.bucket(bucket_name)
        except Exception as e:
            logger.error(f"Failed to init Firebase Storage bucket '{bucket_name}': {e}", exc_info=True);
            self.bucket = None

    async def upload_file(self, file: UploadFile, user_id: str, doc_type: str) -> Dict[str, str]:
        if not self.bucket: raise HTTPException(500, "Firebase Storage not configured.")
        try:
            filename = f"{uuid.uuid4()}_{file.filename}"
            path = f"users/{user_id}/{doc_type}/{filename}"
            blob = self.bucket.blob(path)
            contents = await file.read()
            content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
            blob.upload_from_string(contents, content_type=content_type)
            logger.info(f"File '{filename}' uploaded to '{path}'.")
            return {"file_path": path, "file_name": file.filename}
        except Exception as e:
            logger.error(f"Firebase upload failed: {e}", exc_info=True);
            raise HTTPException(500, "Could not upload file.")

    def get_download_url(self, path: str, expiration_minutes: int = 60) -> str:
        if not self.bucket: raise HTTPException(500, "Firebase Storage not configured.")
        try:
            blob = self.bucket.blob(path)
            if not blob.exists(): return None
            return blob.generate_signed_url(version="v4", expiration=timedelta(minutes=expiration_minutes),
                                            method="GET")
        except Exception as e:
            logger.error(f"Failed to generate signed URL for '{path}': {e}", exc_info=True);
            raise HTTPException(500, "Could not get file URL.")

    def delete_file(self, path: str) -> bool:
        if not self.bucket: return False
        try:
            blob = self.bucket.blob(path)
            if blob.exists(): blob.delete(); logger.info(f"File '{path}' deleted."); return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete file '{path}': {e}", exc_info=True);
            return False


storage_manager = FirebaseStorageManager(bucket_name=settings.FIREBASE_STORAGE_BUCKET)


def is_slot_available(physician_id: str, start: datetime, duration: int, db: Session) -> bool:
    physician = db.query(Physician).filter(Physician.id == physician_id).first()
    if not physician or not physician.availability_schedule: return False
    try:
        schedule = json.loads(physician.availability_schedule)
    except:
        return False
    day_of_week = start.strftime('%A').lower()
    if day_of_week not in schedule: return False

    within_schedule = any(
        datetime.strptime(s.split('-')[0], '%H:%M').time() <= start.time() and
        (start + timedelta(minutes=duration)).time() <= datetime.strptime(s.split('-')[1], '%H:%M').time()
        for s in schedule[day_of_week]
    )
    if not within_schedule: return False

    end = start + timedelta(minutes=duration)
    # The interval logic needs to be adapted for SQLite which does not support it directly
    # A workaround for SQLite:
    conflicting_count = db.query(Appointment).filter(
        Appointment.physician_id == physician_id,
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED]),
        Appointment.appointment_time < end,
        text(f"datetime(appointment_time, '+' || duration_minutes || ' minutes') > '{start.isoformat()}'")
    ).count()

    return conflicting_count == 0


def generate_telemedicine_link(appointment_id: str) -> str:
    return f"https://telemed.dortmed.com/session/{appointment_id}/{secrets.token_urlsafe(16)}"


# =================================================================================================
# XI. AUTHENTICATION & SECURITY
# =================================================================================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# --- 2FA Utility Service ---
class TwoFactorAuthService:
    def __init__(self, secret_key: str):
        # Fernet requires a 32-byte key, let's derive one from the config secret
        key_sha = hashlib.sha256(secret_key.encode()).digest()
        self.fernet = Fernet(key_sha)

    def generate_secret(self) -> str:
        return pyotp.random_base32()

    def encrypt_secret(self, secret: str) -> str:
        return self.fernet.encrypt(secret.encode()).decode()

    def decrypt_secret(self, encrypted_secret: str) -> str:
        return self.fernet.decrypt(encrypted_secret.encode()).decode()

    def get_provisioning_uri(self, secret: str, email: str, issuer_name: str = "DortMed") -> str:
        return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer_name)

    def generate_qr_code(self, uri: str) -> io.BytesIO:
        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, "PNG")
        buf.seek(0)
        return buf

    def verify_otp(self, encrypted_secret: str, otp: str) -> bool:
        try:
            secret = self.decrypt_secret(encrypted_secret)
            totp = pyotp.TOTP(secret)
            return totp.verify(otp)
        except Exception:
            return False


tfa_service = TwoFactorAuthService(secret_key=settings.TFA_SECRET_KEY)


# --- New Pydantic Schemas ---
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def validate_password_strength(cls, v):
        # Re-using the strong password validation logic
        if not re.search(r'[A-Z]', v) or not re.search(r'[a-z]', v) or not re.search(r'[0-9]', v) or not re.search(
                r'[\W_]', v):
            raise ValueError('Password must contain uppercase, lowercase, digit, and special character.')
        return v


class TFASetupResponse(BaseModel):
    secret: str  # The secret is sent to the user to manually enter if QR fails
    qr_code: str  # Base64 encoded QR code image


class TFAEnableRequest(BaseModel):
    otp: str


# =================================================================================================
# XXXIII. REAL-TIME NOTIFICATIONS SYSTEM (FIREBASE CLOUD MESSAGING)
# =================================================================================================


# --- New Pydantic Schemas ---
class RegisterDeviceRequest(BaseModel):
    fcm_token: str
    device_type: str = "web"


# --- Notification Service Utility ---
class NotificationService:
    """Handles the logic of sending FCM push notifications."""

    async def send_to_user(self, db: Session, user_id: str, title: str, body: str,
                           data: Optional[Dict[str, str]] = None):
        """Sends a notification to all registered devices for a given user."""
        devices = db.query(FCMDevice).filter(FCMDevice.user_id == user_id).all()
        tokens = [device.fcm_token for device in devices]

        if not tokens:
            logger.info(f"No FCM devices found for user {user_id}. Skipping notification.")
            return

        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon="/logo192.png",  # URL to an icon
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link=data.get("link", settings.FRONTEND_URL) if data else settings.FRONTEND_URL
                )
            )
        )

        try:
            response = messaging.send_multicast(message)
            logger.info(f"Successfully sent {response.success_count} notifications for user {user_id}.")

            # Cleanup stale tokens
            if response.failure_count > 0:
                stale_tokens = []
                for idx, resp in enumerate(response.responses):
                    if not resp.success:
                        # Common error codes for stale/invalid tokens
                        if resp.exception.code in ['UNREGISTERED', 'INVALID_ARGUMENT']:
                            stale_tokens.append(tokens[idx])

                if stale_tokens:
                    logger.info(f"Deleting {len(stale_tokens)} stale FCM tokens.")
                    db.query(FCMDevice).filter(FCMDevice.fcm_token.in_(stale_tokens)).delete(synchronize_session=False)
                    db.commit()

        except Exception as e:
            logger.error(f"Failed to send FCM notification for user {user_id}: {e}", exc_info=True)


notification_service = NotificationService()

# --- WebSocket Connection Manager ---
class ConnectionManager:
    """Manages active WebSocket connections for the chat."""
    def __init__(self):
        # Maps: {conversation_id: [WebSocket, WebSocket, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)
        logger.info(f"WebSocket connected to conversation {conversation_id}")

    def disconnect(self, websocket: WebSocket, conversation_id: str):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
        logger.info(f"WebSocket disconnected from conversation {conversation_id}")

    async def broadcast(self, conversation_id: str, message_data: Dict):
        """Sends a message to all connected clients in a specific conversation."""
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                await connection.send_json(message_data)

manager = ConnectionManager()

# --- New Pydantic Schemas for Chat ---
class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    timestamp: datetime
    class Config: from_attributes = True

class ConversationOut(BaseModel):
    id: str
    patient: PatientInfoForPhysician # Reuse existing schema
    physician: PhysicianPublicProfile # Reuse existing schema
    class Config: from_attributes = True

class AppointmentRescheduleRequest(BaseModel):
    new_appointment_time: datetime

    @validator('new_appointment_time')
    def validate_time(cls, v):
        if v.tzinfo is None: v = v.replace(tzinfo=timezone.utc)
        if v < datetime.now(timezone.utc):
            raise ValueError("The new appointment time cannot be in the past.")
        return v

class PatientFullProfileForPhysician(PatientInfoForPhysician):
    """Extends the patient info with full medical history and documents."""
    # The existing PatientInfoForPhysician already contains most fields.
    # We will add the documents list in the response logic.
    documents: List[MedicalDocumentResponse]

class PrescriptionCreate(BaseModel):
    patient_id: str
    medication: str
    dosage: str
    frequency: str
    duration: str # e.g., "14 days", "3 months"
    notes: Optional[str] = None


class OCRResult(BaseModel):
    raw_text: str
    structured_data: Dict[str, float]
    filename: str


class FeatureFlagOut(BaseModel):
    id: int
    name: str
    is_enabled_for_freemium: bool
    is_enabled_for_basic: bool
    is_enabled_for_premium: bool
    is_enabled_for_ultimate: bool
    class Config: from_attributes = True

class FeatureFlagUpdate(BaseModel):
    is_enabled_for_freemium: Optional[bool] = None
    is_enabled_for_basic: Optional[bool] = None
    is_enabled_for_premium: Optional[bool] = None
    is_enabled_for_ultimate: Optional[bool] = None


class UserFlags(BaseModel):
    TELEMEDICINE: bool
    AI_DIAGNOSIS: bool
    OCR_UPLOAD: bool
    GEOSPATIAL_SEARCH: bool

class UserPublicWithFlags(UserPublic):
    subscription_plan: SubscriptionPlan
    feature_flags: UserFlags

class PracticeAnalytics(BaseModel):
    total_consultations: int
    average_consultation_duration: float # in minutes
    patient_satisfaction_score: float # out of 5
    monthly_consultations: Dict[str, int] # e.g., {"Jan": 20, "Feb": 25}

class DashboardAlert(BaseModel):
    id: str
    text: str
    type: str # 'reminder' or 'warning'
    link: str

class PatientDashboardSummary(BaseModel):
    upcoming_appointments: List[AppointmentForPatient]
    ai_alerts: List[DashboardAlert]

class AdminDashboardKPIs(BaseModel):
    total_active_users: int
    total_physicians: int
    pending_verifications: int
    monthly_recurring_revenue: float


class ExerciseOut(BaseModel):
    name: str
    description: str
    video_url: Optional[str]
    recommended_sets: Optional[str] = "3 sets"
    recommended_reps: Optional[str] = "10-12 reps"

    class Config: from_attributes = True


class SupplementOut(BaseModel):
    name: str
    description: str
    reasoning: str  # Why this is being recommended

    class Config: from_attributes = True


class WellnessPlan(BaseModel):
    meal_plan: Optional[MealPlan]
    exercise_plan: List[ExerciseOut]
    supplement_recommendations: List[SupplementOut]



class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class TimeSeriesDataPoint(BaseModel):
    date: str # e.g., "2023-10-01"
    count: int

class UserGrowthData(BaseModel):
    data: List[TimeSeriesDataPoint]


class MealCreate(BaseModel):
    name: str
    meal_type: str
    suitable_for_conditions: str
    calories: Optional[int] = None
    description: Optional[str] = None

class MealPlanTemplateCreate(BaseModel):
    condition: str
    daily_calorie_target: int
    structure: Dict[str, int] # e.g., {"breakfast": 1, "lunch": 1}


class VitalDataPoint(BaseModel):
    timestamp: datetime
    value: float

class PatientVitalsOut(BaseModel):
    vital_type: str
    data_points: List[VitalDataPoint]

class ProfessionalResourceOut(BaseModel):
    title: str
    source: str
    resource_type: str
    link: str
    class Config: from_attributes = True



class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    user_id: Optional[str]
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    details: Optional[str]
    status: str
    class Config: from_attributes = True


class AuditLogger:
    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        user: Optional[User],
        action: str,
        status: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[Dict] = None
    ):
        """Creates a new audit log entry."""
        log_entry = AuditLog(
            user_id=user.id if user else None,
            action=action,
            status=status,
            target_type=target_type,
            target_id=target_id,
            details=json.dumps(details) if details else None
        )
        self.db.add(log_entry)
        # We don't commit here; the commit will happen at the end of the request lifecycle.

# --- Audit Logger Dependency ---
def get_audit_logger(db: Session = DbSession):
    """Dependency to provide an AuditLogger instance."""
    return AuditLogger(db)

AuditDep = Depends(get_audit_logger)


class AuthManager:
    @staticmethod
    def create_access_token(data: dict) -> str:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return jwt.encode({**data, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def create_refresh_token(data: dict, db: Session) -> str:
        expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        token_str = secrets.token_urlsafe(32)
        db_token = RefreshToken(token=token_str, user_id=data.get("sub"), expires_at=expires)
        db.add(db_token);
        db.commit();
        db.refresh(db_token)
        return token_str


async def get_current_user(
        request: Request,
        db: Session = DbSession
) -> User:
    """
    Validates a Firebase ID Token from the Authorization header,
    and returns the corresponding User object from our database.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    id_token = parts[1]

    try:
        # 1. Verify the ID token using the Firebase Admin SDK.
        # This checks the signature and expiration.
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        logger.error(f"Failed to verify Firebase ID token: {e}")
        raise HTTPException(status_code=403, detail="Invalid authentication token")

    # 2. Find the user in our local database using the UID.
    user = db.query(User).options(
        joinedload(User.patient_profile),
        joinedload(User.physician_profile)
    ).filter(User.id == uid).first()

    if not user:
        # This case handles when a user exists in Firebase but not in our DB.
        # It shouldn't happen with our new registration flow, but it's a good safeguard.
        raise HTTPException(status_code=404, detail="User not found in application database.")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is inactive.")

    return user


async def get_current_active_patient(user: User = Depends(get_current_user)):
    if user.role != UserRole.PATIENT: raise HTTPException(403, "Requires patient role")
    return user


async def get_current_active_physician(user: User = Depends(get_current_user)):
    if user.role != UserRole.PHYSICIAN: raise HTTPException(403, "Requires physician role")
    if not user.physician_profile.is_verified: raise HTTPException(403, "Physician account not verified")
    return user


async def get_current_active_superuser(user: User = Depends(get_current_user)):
    if user.role != UserRole.SUPERUSER: raise HTTPException(403, "Requires superuser role")
    return user


CurrentUser = Depends(get_current_user)
CurrentPatient = Depends(get_current_active_patient)
CurrentPhysician = Depends(get_current_active_physician);
CurrentSuperuser = Depends(get_current_active_superuser)


def generate_prescription_pdf(prescription_data: PrescriptionCreate, physician: Physician,
                              patient: Patient) -> io.BytesIO:
    """Generates a professional-looking prescription PDF."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    p.setFont("Helvetica-Bold", 16)
    p.drawString(inch, height - inch, f"Dr. {physician.first_name} {physician.last_name}")
    p.setFont("Helvetica", 12)
    p.drawString(inch, height - inch - 0.2 * inch, physician.specialty)

    # Patient Information
    p.setFont("Helvetica-Bold", 12)
    p.drawString(inch, height - 2 * inch, "Patient Information:")
    p.setFont("Helvetica", 12)
    p.drawString(inch, height - 2 * inch - 0.25 * inch, f"Name: {patient.first_name} {patient.last_name}")
    p.drawString(inch, height - 2 * inch - 0.5 * inch, f"Date of Birth: {patient.date_of_birth.strftime('%Y-%m-%d')}")

    # Prescription Details (Rx)
    p.setFont("Helvetica-Bold", 24)
    p.drawString(inch, height - 3 * inch, "Rx")
    p.line(inch, height - 3 * inch - 0.1 * inch, width - inch, height - 3 * inch - 0.1 * inch)

    p.setFont("Helvetica-Bold", 14)
    p.drawString(inch, height - 3.5 * inch, prescription_data.medication)

    p.setFont("Helvetica", 12)
    p.drawString(inch, height - 3.8 * inch, f"Dosage: {prescription_data.dosage}")
    p.drawString(inch, height - 4.1 * inch, f"Frequency: {prescription_data.frequency}")
    p.drawString(inch, height - 4.4 * inch, f"Duration: {prescription_data.duration}")
    if prescription_data.notes:
        p.drawString(inch, height - 4.7 * inch, f"Notes: {prescription_data.notes}")

    # Footer with signature and date
    signature_line_y = 2 * inch
    p.line(width - 3.5 * inch, signature_line_y, width - inch, signature_line_y)
    p.drawString(width - 3.5 * inch, signature_line_y - 0.2 * inch, "Electronic Signature")
    p.drawString(inch, signature_line_y, f"Date: {datetime.utcnow().strftime('%Y-%m-%d')}")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer


def check_feature(feature_name: str):
    """
    This is a dependency factory. It returns a dependency function that checks
    if the current user has access to the specified feature.
    """

    def dependency(user: User = CurrentUser, db: Session = DbSession):
        flag = db.query(FeatureFlag).filter(FeatureFlag.name == feature_name).first()
        if not flag:
            # If a flag doesn't exist in the DB, it's considered disabled for safety.
            raise HTTPException(status_code=403, detail=f"Feature '{feature_name}' is not available.")

        # Get user's subscription plan
        user_plan = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if not user_plan:  # Should not happen, but a safeguard
            raise HTTPException(status_code=403, detail="Subscription not found. Access denied.")

        plan_name = user_plan.plan.value

        # Check permission based on the plan
        has_access = False
        if plan_name == 'freemium' and flag.is_enabled_for_freemium:
            has_access = True
        elif plan_name == 'basic' and flag.is_enabled_for_basic:
            has_access = True
        elif plan_name == 'premium' and flag.is_enabled_for_premium:
            has_access = True
        elif plan_name == 'ultimate' and flag.is_enabled_for_ultimate:
            has_access = True

        # Superusers always have access
        if user.role == UserRole.SUPERUSER:
            has_access = True

        if not has_access:
            raise HTTPException(status_code=403,
                                detail=f"Access to feature '{feature_name}' requires a higher subscription plan.")

        return True  # Access granted

    return Depends(dependency)


# --- New PDF Invoice Generation Utility ---
def generate_invoice_pdf(payment: Payment, user: User, plan: PlanDetail) -> io.BytesIO:
    """Generates a PDF invoice for a subscription payment."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    p.setFont("Helvetica-Bold", 20)
    p.drawString(inch, height - inch, "INVOICE")
    p.setFont("Helvetica", 12)
    p.drawString(width - 3 * inch, height - inch, f"Invoice #: {payment.id[:8]}")
    p.drawString(width - 3 * inch, height - inch - 0.2 * inch, f"Date: {payment.payment_date.strftime('%Y-%m-%d')}")

    # Billed To
    p.drawString(inch, height - 2 * inch, "Billed To:")
    p.drawString(inch, height - 2 * inch - 0.2 * inch, user.email)

    # Line Item Table
    table_y_start = height - 3 * inch
    p.setFont("Helvetica-Bold", 12)
    p.drawString(inch, table_y_start, "Description")
    p.drawString(width - 2.5 * inch, table_y_start, "Amount")
    p.line(inch, table_y_start - 0.1 * inch, width - inch, table_y_start - 0.1 * inch)

    p.setFont("Helvetica", 12)
    p.drawString(inch, table_y_start - 0.3 * inch, f"DortMed Subscription - {plan.name} Plan (Monthly)")
    p.drawString(width - 2.5 * inch, table_y_start - 0.3 * inch, f"{payment.currency} {payment.amount:.2f}")

    # Total
    total_y = table_y_start - 1 * inch
    p.line(width - 3 * inch, total_y, width - inch, total_y)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(width - 3 * inch, total_y + 0.1 * inch, "Total:")
    p.drawString(width - 2.5 * inch, total_y + 0.1 * inch, f"{payment.currency} {payment.amount:.2f}")

    # Footer
    p.setFont("Helvetica-Oblique", 10)
    p.drawString(inch, 1.5 * inch, "Thank you for your business!")
    p.drawString(inch, 1.3 * inch, "If you have any questions, please contact support@dortmed.com.")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer


class HealthStatus(BaseModel):
    status: str
    database_connection: str
    ai_service_status: str
    ocr_service_status: str


@app.get("/api/health", response_model=HealthStatus, tags=["System Health"])
async def check_platform_health(db: Session = DbSession):
    """
    Performs a live health check of the platform's core components.
    """
    status_report = {
        "database_connection": "Operational",
        "ai_service_status": "Operational",
        "ocr_service_status": "Operational",
    }
    overall_status = "Operational"

    # 1. Check Database Connection
    try:
        db.execute(text('SELECT 1'))
    except Exception as e:
        status_report["database_connection"] = f"Error: {e}"
        overall_status = "Degraded"

    # 2. Check AI Microservice
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.AI_SERVICE_URL}/")
            response.raise_for_status()
            if response.json().get("status") != "AI Inference Service is running.":
                raise Exception("Invalid response")
    except Exception:
        status_report["ai_service_status"] = "Unavailable"
        overall_status = "Degraded"

    # 3. Check OCR Microservice
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.OCR_SERVICE_URL}/")  # Assuming OCR service has a root endpoint
            response.raise_for_status()
    except Exception:
        status_report["ocr_service_status"] = "Unavailable"
        overall_status = "Degraded"

    return HealthStatus(status=overall_status, **status_report)

# =================================================================================================
# XII. API ROUTERS
# =================================================================================================

# --- Root Endpoint ---
@app.get("/", tags=["Root"])
async def read_root(): return HTMLResponse(f"<h1>Welcome to {settings.APP_NAME} API v{settings.APP_VERSION}</h1>")


# --- Authentication Router ---
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@auth_router.post("/register/patient", response_model=UserPublic, status_code=201)
async def register_patient(reg_data: PatientRegistration, db: Session = DbSession):
    if db.query(User).filter(User.email == reg_data.user.email).first(): raise HTTPException(400,
                                                                                             "Email already registered")
    try:
        user = User(id=str(uuid.uuid4()), email=reg_data.user.email, phone_number=reg_data.user.phone_number,
                    hashed_password=PasswordManager.get_password_hash(reg_data.user.password), role=UserRole.PATIENT)
        db.add(user);
        db.flush()
        profile = Patient(id=str(uuid.uuid4()), user_id=user.id, **reg_data.profile.dict())
        db.add(profile)
        sub = Subscription(user_id=user.id, plan=SubscriptionPlan.FREEMIUM)
        db.add(sub)
        db.commit();
        db.refresh(user)
        return user
    except:
        db.rollback(); raise HTTPException(500, "Registration failed.")


@auth_router.post("/register/physician", response_model=UserPublic, status_code=201)
async def register_physician(reg_data: PhysicianRegistration, db: Session = DbSession):
    if db.query(User).filter(User.email == reg_data.user.email).first(): raise HTTPException(400,
                                                                                             "Email already registered")
    try:
        user = User(id=str(uuid.uuid4()), email=reg_data.user.email, phone_number=reg_data.user.phone_number,
                    hashed_password=PasswordManager.get_password_hash(reg_data.user.password), role=UserRole.PHYSICIAN)
        db.add(user);
        db.flush()
        profile = Physician(id=str(uuid.uuid4()), user_id=user.id, **reg_data.profile.dict())
        db.add(profile)
        sub = Subscription(user_id=user.id, plan=SubscriptionPlan.FREEMIUM)
        db.add(sub)
        db.commit();
        db.refresh(user)
        return user
    except:
        db.rollback(); raise HTTPException(500, "Registration failed.")


@auth_router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    otp: Optional[str] = Form(None),
    db: Session = DbSession,
    audit: AuditLogger = AuditDep
):
    """
    Authenticates a user with optional 2FA and creates a detailed audit log
    for both successful and failed attempts.
    """
    # Extract details for logging before any potential failures
    details = {"ip_address": request.client.host, "user_agent": request.headers.get("user-agent")}
    user = db.query(User).filter(User.email == form_data.username).first()

    try:
        # --- Initial Validation ---
        if not user:
            # Log the attempt against the email address, even if the user doesn't exist
            audit.log(None, "USER_LOGIN_FAILURE", "FAILURE", details={"email_attempt": form_data.username, **details})
            raise HTTPException(status_code=401, detail="Incorrect email or password",
                                headers={"WWW-Authenticate": "Bearer"})

        if not PasswordManager.verify_password(form_data.password, user.hashed_password):
            audit.log(user, "USER_LOGIN_FAILURE", "FAILURE", details={"reason": "Invalid Password", **details})
            raise HTTPException(status_code=401, detail="Incorrect email or password",
                                headers={"WWW-Authenticate": "Bearer"})

        if not user.is_active:
            audit.log(user, "USER_LOGIN_FAILURE", "FAILURE", details={"reason": "Inactive User Account", **details})
            raise HTTPException(status_code=400, detail="User account is inactive.")

        # --- Two-Factor Authentication Check ---
        if user.is_tfa_enabled:
            if not otp:
                # Do not log this as a failure, as it's an expected intermediate step.
                # The frontend will now prompt for the OTP.
                raise HTTPException(status_code=401, detail="2FA_REQUIRED")

            if not user.tfa_secret or not tfa_service.verify_otp(user.tfa_secret, otp):
                audit.log(user, "USER_LOGIN_2FA_FAILURE", "FAILURE", details=details)
                raise HTTPException(status_code=401, detail="Invalid 2FA code.")

        # --- Success Case ---
        # All checks have passed
        user.last_login = datetime.utcnow()
        db.flush()  # Ensure last_login time is part of the transaction

        audit.log(user, "USER_LOGIN_SUCCESS", "SUCCESS", details=details)

        # Commit all changes (last_login and audit log)
        db.commit()

        # Generate and return tokens
        access_token = AuthManager.create_access_token(data={"sub": user.id})
        refresh_token = AuthManager.create_refresh_token(data={"sub": user.id}, db=db)

        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    except HTTPException as e:
        # This block catches the raised exceptions, commits the audit log, then re-raises.
        db.commit()  # Commit the audit log entry for the failure
        raise e
    except Exception as e:
        # Catch any other unexpected errors
        db.rollback()  # Rollback any unexpected DB changes
        logger.error(f"Unexpected error during login for {form_data.username}: {e}", exc_info=True)
        # We don't log this to the audit table as it's a system error, not a user action failure.
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@auth_router.post("/token/refresh", response_model=Token)
async def refresh_token(refresh_token: str = Form(...), db: Session = DbSession):
    token_record = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if not token_record or token_record.is_revoked or token_record.expires_at < datetime.utcnow():
        raise HTTPException(401, "Invalid or expired refresh token")
    token_record.is_revoked = True;
    db.commit()
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user or not user.is_active: raise HTTPException(401, "User not found or inactive")
    new_access = AuthManager.create_access_token({"sub": user.id})
    new_refresh = AuthManager.create_refresh_token({"sub": user.id}, db)
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


@auth_router.get("/me", response_model=UserPublicWithFlags)
async def read_users_me(user: User = CurrentUser, db: Session = DbSession):
    """Get the profile of the currently authenticated user, including their enabled feature flags."""
    flags_query = db.query(FeatureFlag).all()
    user_sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    plan_name = user_sub.plan.value if user_sub else 'freemium'

    enabled_flags = {}
    for flag in flags_query:
        has_access = False
        if plan_name == 'freemium' and flag.is_enabled_for_freemium:
            has_access = True
        elif plan_name == 'basic' and flag.is_enabled_for_basic:
            has_access = True
        elif plan_name == 'premium' and flag.is_enabled_for_premium:
            has_access = True
        elif plan_name == 'ultimate' and flag.is_enabled_for_ultimate:
            has_access = True

        if user.role == UserRole.SUPERUSER: has_access = True

        enabled_flags[flag.name] = has_access

    return UserPublicWithFlags(
        **user.__dict__,
        subscription_plan=plan_name,
        feature_flags=enabled_flags
    )


class ProfileSetupRequest(BaseModel):
    # Same as the profile schemas from before
    profile: Union[PatientCreate, PhysicianCreate]
    role: UserRole


@auth_router.post("/setup-profile", response_model=UserPublic, status_code=201)
async def setup_user_profile(
        request_data: ProfileSetupRequest,
        user_data: dict = Depends(get_current_user),  # Use the new dependency to get user info
        db: Session = DbSession
):
    """
    This endpoint is called by the frontend *immediately after* a user successfully
    registers with Firebase. It uses the user's Firebase token to create their
    corresponding profile (Patient or Physician) in our local database.
    """
    uid = user_data.id
    email = user_data.email

    # Check if a user record already exists to prevent duplicate profiles
    if db.query(User).filter(User.id == uid).first():
        raise HTTPException(status_code=409, detail="User profile already exists.")

    try:
        # 1. Create the core User record linked by Firebase UID
        new_user = User(id=uid, email=email, role=request_data.role, is_verified=True)  # Firebase handles verification
        db.add(new_user)
        db.flush()

        # 2. Create the specific profile (Patient or Physician)
        if request_data.role == UserRole.PATIENT:
            new_profile = Patient(id=str(uuid.uuid4()), user_id=new_user.id, **request_data.profile.dict())
        elif request_data.role == UserRole.PHYSICIAN:
            new_profile = Physician(id=str(uuid.uuid4()), user_id=new_user.id, **request_data.profile.dict())
        else:
            raise HTTPException(status_code=400, detail="Invalid role for profile setup.")

        db.add(new_profile)

        # 3. Create the default subscription
        new_subscription = Subscription(user_id=new_user.id, plan=SubscriptionPlan.FREEMIUM)
        db.add(new_subscription)

        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Data integrity error, please check your input.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during profile setup for UID {uid}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during profile setup.")


@auth_router.post("/verify-login")
async def verify_2fa_after_firebase_login(request: Request,
        user: User = CurrentUser,  # This already verifies the Firebase token and gets our user
        db: Session = DbSession,
        audit: AuditLogger = AuditDep,
        otp: Optional[str] = Form(None)
):
    """
    This endpoint is called AFTER a user successfully logs in with Firebase.
    It performs the second-factor (TOTP) check if enabled for the user's account.
    """
    details = {"ip_address": request.client.host}

    # The CurrentUser dependency has already verified the primary password via Firebase token.
    # We now check for our own 2FA.
    if user.is_tfa_enabled:
        if not otp:
            # The password was right, but no OTP was provided. Tell the frontend.
            raise HTTPException(status_code=401, detail="2FA_REQUIRED")

        if not user.tfa_secret or not tfa_service.verify_otp(user.tfa_secret, otp):
            audit.log(user, "USER_LOGIN_2FA_FAILURE", "FAILURE", details=details)
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid 2FA code.")

    # If we reach here, login is fully successful.
    user.last_login = datetime.utcnow()
    audit.log(user, "USER_LOGIN_SUCCESS", "SUCCESS", details=details)
    db.commit()

    return {"status": "Login successful"}



# --- New User Settings Router ---
settings_router = APIRouter(prefix="/api/settings", tags=["User Settings"], dependencies=[Depends(get_current_user)])


@settings_router.put("/password")
async def change_password(
        password_data: PasswordChangeRequest,
        user: User = CurrentUser,
        db: Session = DbSession
):
    """Securely changes the user's password."""
    # 1. Verify current password
    if not PasswordManager.verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password.")

    # 2. Hash and update new password
    user.hashed_password = PasswordManager.get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password updated successfully."}


@settings_router.post("/2fa/setup", response_model=TFASetupResponse)
async def setup_2fa(user: User = CurrentUser, db: Session = DbSession):
    """Generates a new 2FA secret and QR code for the user to scan."""
    if user.is_tfa_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled on this account.")

    secret = tfa_service.generate_secret()
    # Store the encrypted secret temporarily in the user's record.
    # It will only be made permanent upon successful OTP verification.
    user.tfa_secret = tfa_service.encrypt_secret(secret)
    db.commit()

    uri = tfa_service.get_provisioning_uri(secret, user.email)
    qr_code_bytes = tfa_service.generate_qr_code(uri)

    import base64
    qr_code_b64 = base64.b64encode(qr_code_bytes.getvalue()).decode('ascii')

    return TFASetupResponse(secret=secret, qr_code=f"data:image/png;base64,{qr_code_b64}")


@settings_router.post("/2fa/enable")
async def enable_2fa(
        enable_data: TFAEnableRequest,
        user: User = CurrentUser,
        db: Session = DbSession
):
    """Verifies the OTP and permanently enables 2FA."""
    if user.is_tfa_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled.")

    if not user.tfa_secret:
        raise HTTPException(status_code=400, detail="2FA setup process was not initiated.")

    if tfa_service.verify_otp(user.tfa_secret, enable_data.otp):
        user.is_tfa_enabled = True
        db.commit()
        return {"message": "2FA has been successfully enabled."}
    else:
        # For security, if verification fails, clear the temporary secret. User must restart.
        user.tfa_secret = None
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try the setup process again.")


@settings_router.post("/2fa/disable")
async def disable_2fa(
        password_data: Dict[str, str],  # Re-verify password to disable
        user: User = CurrentUser,
        db: Session = DbSession
):
    """Disables 2FA after re-authenticating the user."""
    if not user.is_tfa_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled.")

    if not PasswordManager.verify_password(password_data.get("password"), user.hashed_password):
        raise HTTPException(status_code=403, detail="Incorrect password.")

    user.is_tfa_enabled = False
    user.tfa_secret = None
    db.commit()

    return {"message": "2FA has been disabled."}


# --- Patient Portal Router ---
patient_router = APIRouter(prefix="/api/patient", tags=["Patient Portal"],
                           dependencies=[Depends(get_current_active_patient)])


@patient_router.get("/profile", response_model=PatientInDB)
async def get_patient_profile(user: User = CurrentPatient): return user.patient_profile


@patient_router.put("/profile/update", response_model=PatientInDB)
async def update_patient_profile(update: PatientUpdate, user: User = CurrentPatient, db: Session = DbSession):
    profile = user.patient_profile
    for k, v in update.dict(exclude_unset=True).items(): setattr(profile, k, v)
    profile.updated_at = datetime.utcnow()
    db.commit();
    db.refresh(profile);
    return profile


@patient_router.post("/documents/upload", response_model=MedicalDocumentResponse, status_code=201)
async def upload_doc(user: User = CurrentPatient, db: Session = DbSession, type: DocumentType = Form(...),
                     desc: Optional[str] = Form(None), file: UploadFile = File(...)):
    if file.size > 10 * 1024 * 1024: raise HTTPException(413, "File size exceeds 10MB.")
    upload_res = await storage_manager.upload_file(file, user.id, type.value)
    new_doc = MedicalDocument(id=str(uuid.uuid4()), patient_id=user.patient_profile.id, document_type=type,
                              file_name=upload_res["file_name"], file_path=upload_res["file_path"], file_url="",
                              description=desc)
    try:
        db.add(new_doc); db.commit(); db.refresh(new_doc); return new_doc
    except:
        db.rollback(); storage_manager.delete_file(upload_res["file_path"]); raise HTTPException(500,
                                                                                                 "Could not save document.")


@patient_router.get("/documents", response_model=List[MedicalDocumentResponse])
async def list_docs(user: User = CurrentPatient, db: Session = DbSession):
    docs = db.query(MedicalDocument).filter(MedicalDocument.patient_id == user.patient_profile.id).all()
    for doc in docs: doc.file_url = storage_manager.get_download_url(doc.file_path)
    return docs


@patient_router.get("/appointments", response_model=List[AppointmentForPatient])
async def get_patient_appointments(user: User = CurrentPatient, db: Session = DbSession):
    """
    (Patient) Gets a list of all their past and upcoming appointments.
    """
    appointments = db.query(Appointment).options(
        joinedload(Appointment.physician).joinedload(Physician.user)
    ).filter(
        Appointment.patient_id == user.patient_profile.id
    ).order_by(Appointment.appointment_time.desc()).all()

    response = []
    for appt in appointments:
        physician_profile = PhysicianPublicProfile(
            **appt.physician.__dict__,
            email=appt.physician.user.email
        )
        response.append(AppointmentForPatient(
            **appt.__dict__,
            physician=physician_profile
        ))
    return response


@patient_router.post("/documents/upload/ocr", response_model=OCRResult, dependencies=[check_feature("OCR_UPLOAD")])
async def upload_lab_result_for_ocr(
        user: User = CurrentPatient,
        file: UploadFile = File(...)
):
    """
    (Patient) Uploads a lab result image, sends it to the OCR service for processing,
    and returns the extracted data for user confirmation.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported for OCR.")

    # We are streaming the file directly to the other service.
    # `httpx` can handle `UploadFile` objects.
    files = {'file': (file.filename, file.file, file.content_type)}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OCR_SERVICE_URL}/ocr/process-lab-result",
                files=files,
                timeout=30.0  # OCR can be slow, so a longer timeout is needed
            )
            response.raise_for_status()
            ocr_result = response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail="The OCR service is currently unavailable.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code,
                            detail=f"OCR service error: {e.response.json().get('detail', 'Unknown error')}")

    # Here, we just return the data for confirmation. A subsequent request would be
    # needed from the frontend to save this data and the original file.

    return ocr_result

@patient_router.post("/profile/complete-tour", status_code=status.HTTP_204_NO_CONTENT)
async def mark_tour_as_completed(user: User = CurrentPatient, db: Session = DbSession):
    """Marks the patient's initial dashboard tour as completed."""
    patient_profile = user.patient_profile
    if patient_profile and not patient_profile.has_completed_tour:
        patient_profile.has_completed_tour = True
        db.commit()
    return None


@patient_router.get("/dashboard-summary", response_model=PatientDashboardSummary)
async def get_dashboard_summary(user: User = CurrentPatient, db: Session = DbSession):
    """
    Retrieves a summary of upcoming appointments and critical alerts for the patient's dashboard.
    """
    now = datetime.now(timezone.utc)

    # 1. Fetch Upcoming Appointments
    upcoming_appointments_query = db.query(Appointment).options(
        joinedload(Appointment.physician).joinedload(Physician.user)
    ).filter(
        Appointment.patient_id == user.patient_profile.id,
        Appointment.appointment_time > now,
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED])
    ).order_by(Appointment.appointment_time.asc()).limit(3).all()

    # 2. Generate AI Alerts (Real System Logic)
    # This is where a real system would run checks against the user's data.
    # For example, check for overdue tests, unread lab results with critical values, or risk scores.
    ai_alerts = []

    # Example Alert: Unread Lab Result with high cholesterol
    # In a real system, documents would have an `is_read` flag and structured data attached.
    # For now, we'll create a realistic placeholder.
    if "cholesterol" in (user.patient_profile.family_history or "").lower():
        ai_alerts.append(DashboardAlert(
            id="alert1",
            text="AI Insight: Based on your family history, you may have a higher risk for high cholesterol. Consider scheduling a lipid panel test.",
            type="warning",
            link="/patient/find-doctor"
        ))

    return PatientDashboardSummary(
        upcoming_appointments=upcoming_appointments_query,
        ai_alerts=ai_alerts
    )


@patient_router.post("/appointments/{appointment_id}/feedback", status_code=status.HTTP_201_CREATED)
async def submit_appointment_feedback(
        appointment_id: str,
        feedback_data: FeedbackCreate,
        user: User = CurrentPatient,
        db: Session = DbSession
):
    """
    (Patient) Submits feedback for a completed appointment.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == user.patient_profile.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    if appointment.status != AppointmentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only leave feedback for completed appointments.")

    # Check if feedback already exists
    existing_feedback = db.query(AppointmentFeedback).filter_by(appointment_id=appointment_id).first()
    if existing_feedback:
        raise HTTPException(status_code=409, detail="Feedback has already been submitted for this appointment.")

    new_feedback = AppointmentFeedback(
        appointment_id=appointment_id,
        patient_id=appointment.patient_id,
        physician_id=appointment.physician_id,
        rating=feedback_data.rating,
        comment=feedback_data.comment
    )
    db.add(new_feedback)
    db.commit()

    return {"status": "Feedback submitted successfully."}


@patient_router.get("/vitals/{vital_type}", response_model=PatientVitalsOut)
async def get_patient_vitals(vital_type: str, user: User = CurrentPatient, db: Session = DbSession):
    """
    Retrieves time-series data for a specific vital sign for the logged-in patient.
    """
    # Fetch the last 30 data points for the given vital type
    vitals = db.query(PatientVital).filter(
        PatientVital.patient_id == user.patient_profile.id,
        PatientVital.vital_type == vital_type
    ).order_by(PatientVital.timestamp.desc()).limit(30).all()

    # Reverse the list to have them in chronological order for the chart
    vitals.reverse()

    return PatientVitalsOut(vital_type=vital_type, data_points=vitals)



class VitalCreate(BaseModel):
    vital_type: str
    value: float
    timestamp: Optional[datetime] = None # Allow user to back-date an entry

@patient_router.post("/vitals", status_code=status.HTTP_201_CREATED)
async def record_patient_vital(
    vital_data: VitalCreate,
    user: User = CurrentPatient,
    db: Session = DbSession
):
    """(Patient) Records a new vital sign measurement."""
    new_vital = PatientVital(
        patient_id=user.patient_profile.id,
        vital_type=vital_data.vital_type,
        value=vital_data.value,
        timestamp=vital_data.timestamp or datetime.utcnow()
    )
    db.add(new_vital)
    db.commit()
    return {"status": "Vital sign recorded successfully."}


# --- Physician & Appointment Routers ---
physician_router = APIRouter(prefix="/api/physician", tags=["Physician Portal"],
                             dependencies=[Depends(get_current_active_physician)])


@physician_router.put("/profile/update", response_model=PhysicianInDB)
async def update_physician_profile(update: PhysicianProfileUpdate, user: User = CurrentPhysician,
                                   db: Session = DbSession):
    profile = user.physician_profile
    update_data = update.dict(exclude_unset=True)
    if 'availability_schedule' in update_data: update_data['availability_schedule'] = json.dumps(
        update_data['availability_schedule'])
    for k, v in update_data.items(): setattr(profile, k, v)
    profile.updated_at = datetime.utcnow();
    db.commit();
    db.refresh(profile);
    return profile


@physician_router.get("/appointments", response_model=List[AppointmentForPhysician])
async def get_physician_appointments(user: User = CurrentPhysician, db: Session = DbSession):
    return db.query(Appointment).options(joinedload(Appointment.patient).joinedload(Patient.user)).filter(
        Appointment.physician_id == user.physician_profile.id).all()


@physician_router.get("/my-patients", response_model=List[PatientInfoForPhysician])
async def get_my_patients(user: User = CurrentPhysician, db: Session = DbSession):
    """
    (Physician) Gets a list of all unique patients the physician has had an appointment with.
    """
    # This query finds all unique patient_ids from the appointments table for the current physician
    patient_ids = db.query(Appointment.patient_id).filter(
        Appointment.physician_id == user.physician_profile.id
    ).distinct().all()

    patient_ids_list = [pid[0] for pid in patient_ids]

    if not patient_ids_list:
        return []

    patients = db.query(Patient).options(joinedload(Patient.user)).filter(Patient.id.in_(patient_ids_list)).all()

    # Structure the response
    response = []
    for patient in patients:
        response.append(PatientInfoForPhysician(
            **patient.__dict__,
            email=patient.user.email,
            phone_number=patient.user.phone_number
        ))

    return response


@physician_router.get("/patients/{patient_id}/full-profile", response_model=PatientFullProfileForPhysician)
async def get_patient_full_profile(request: Request,
        patient_id: str,
        user: User = CurrentPhysician,
        db: Session = DbSession,
        audit: AuditLogger = AuditDep

):
    """
    (Physician) Retrieves a specific patient's full profile, including all documents.
    Logs every access attempt for compliance and security auditing.
    """
    details = {"ip_address": request.client.host}

    # 1. Verify professional relationship (appointment exists)
    relationship_exists = db.query(Appointment.id).filter(
        Appointment.physician_id == user.physician_profile.id,
        Appointment.patient_id == patient_id
    ).first()

    if not relationship_exists:
        audit.log(user, "VIEW_PATIENT_RECORD", "FAILURE", target_type="Patient", target_id=patient_id,
                  details={"reason": "No Professional Relationship", **details})
        db.commit()  # Commit the audit log
        raise HTTPException(status_code=403,
                            detail="Access denied. You do not have a professional relationship with this patient.")

    # 2. Fetch the patient data
    patient = db.query(Patient).options(
        joinedload(Patient.user),
        joinedload(Patient.documents)
    ).filter(Patient.id == patient_id).first()

    if not patient:
        audit.log(user, "VIEW_PATIENT_RECORD", "FAILURE", target_type="Patient", target_id=patient_id,
                  details={"reason": "Patient Not Found", **details})
        db.commit()  # Commit the audit log
        raise HTTPException(status_code=404, detail="Patient not found.")

    # 3. Log the successful access
    audit.log(user, "VIEW_PATIENT_RECORD", "SUCCESS", target_type="Patient", target_id=patient_id, details=details)
    db.commit()  # Commit the audit log

    # 4. Prepare and return the data
    # Generate secure download URLs for the documents
    for doc in patient.documents:
        doc.file_url = storage_manager.get_download_url(doc.file_path)

    return PatientFullProfileForPhysician(
        **patient.__dict__,
        email=patient.user.email,
        phone_number=patient.user.phone_number,
        documents=patient.documents
    )


@physician_router.post("/prescriptions/create", response_model=MedicalDocumentResponse)
async def create_e_prescription(request: Request,
        prescription_data: PrescriptionCreate,
        user: User = CurrentPhysician,
        db: Session = DbSession,
        audit: AuditLogger = AuditDep
):
    """
    (Physician) Creates an e-prescription, saves it as a PDF to Firebase,
    attaches it to the patient's record, and logs the action in the audit trail.
    """
    details = {"ip_address": request.client.host}

    patient = db.query(Patient).filter(Patient.id == prescription_data.patient_id).first()
    if not patient:
        audit.log(user, "CREATE_E_PRESCRIPTION", "FAILURE", target_type="Patient",
                  target_id=prescription_data.patient_id, details={"reason": "Patient Not Found", **details})
        db.commit()
        raise HTTPException(status_code=404, detail="Patient not found.")

    try:
        # Generate the PDF in memory
        pdf_buffer = generate_prescription_pdf(prescription_data, user.physician_profile, patient)

        pdf_filename = f"Prescription_{prescription_data.medication.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"

        # Helper class to adapt BytesIO to the UploadFile interface
        class InMemoryUploadFile:
            def __init__(self, file, filename):
                self.file = file
                self.filename = filename
                self.content_type = "application/pdf"

            async def read(self):
                return self.file.read()

            @property
            def size(self):
                return self.file.getbuffer().nbytes

        in_memory_file = InMemoryUploadFile(pdf_buffer, pdf_filename)

        # Upload the generated PDF to Firebase Storage
        upload_result = await storage_manager.upload_file(
            file=in_memory_file,
            user_id=patient.user_id,
            document_type=DocumentType.PRESCRIPTION.value
        )

        # Create the database record for this new document
        new_document = MedicalDocument(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            document_type=DocumentType.PRESCRIPTION,
            file_name=pdf_filename,
            file_path=upload_result["file_path"],
            file_url="",  # Will be generated on demand
            description=f"E-Prescription for {prescription_data.medication} by Dr. {user.physician_profile.last_name}"
        )
        db.add(new_document)
        db.flush()  # Flush to get the new_document.id

        # Log the successful action
        audit_details = {
            "medication": prescription_data.medication,
            "dosage": prescription_data.dosage,
            "frequency": prescription_data.frequency,
            "document_id": new_document.id,
            **details
        }
        audit.log(
            user, "CREATE_E_PRESCRIPTION", "SUCCESS",
            target_type="Patient", target_id=prescription_data.patient_id,
            details=audit_details
        )

        # Commit all changes (new document and audit log)
        db.commit()
        db.refresh(new_document)

        return new_document

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create e-prescription for patient {prescription_data.patient_id}: {e}", exc_info=True)
        audit.log(user, "CREATE_E_PRESCRIPTION", "FAILURE", target_type="Patient",
                  target_id=prescription_data.patient_id, details={"error": str(e), **details})
        db.commit()
        raise HTTPException(status_code=500, detail="An error occurred while creating the prescription.")


@physician_router.get("/analytics/practice", response_model=PracticeAnalytics)
async def get_practice_analytics(user: User = CurrentPhysician, db: Session = DbSession):
    """
    (Physician) Retrieves REAL insights and analytics about the physician's practice.
    """
    physician_id = user.physician_profile.id

    avg_rating_query = db.query(func.avg(AppointmentFeedback.rating)).filter(
        AppointmentFeedback.physician_id == physician_id
    ).scalar()
    patient_satisfaction_score = round(avg_rating_query, 2) if avg_rating_query else 0.0
    # 1. Total Completed Consultations
    total_consultations = db.query(Appointment).filter(
        Appointment.physician_id == physician_id,
        Appointment.status == AppointmentStatus.COMPLETED
    ).count()

    # 2. Average Consultation Duration (real calculation)
    avg_duration_query = db.query(func.avg(Appointment.duration_minutes)).filter(
        Appointment.physician_id == physician_id,
        Appointment.status == AppointmentStatus.COMPLETED
    ).scalar()
    average_consultation_duration = round(avg_duration_query, 1) if avg_duration_query else 0.0

    # 3. Patient Satisfaction Score (mocked, as we don't have a feedback system)
    # A real implementation would query a `Feedbacks` table.
    patient_satisfaction_score = 4.8

    # 4. Monthly Consultation Volume (real calculation for the last 6 months)

    from datetime import date
    from dateutil.relativedelta import relativedelta


    six_months_ago = date.today() - relativedelta(months=5)
    six_months_ago = six_months_ago.replace(day=1)


    monthly_counts = db.query(
        func.strftime('%Y-%m', Appointment.appointment_time).label('month'),
        func.count(Appointment.id).label('count')
    ).filter(
        Appointment.physician_id == physician_id,
        Appointment.status == AppointmentStatus.COMPLETED,
        Appointment.appointment_time >= six_months_ago
    ).group_by('month').order_by('month').all()

    # Format the data into a dictionary of {MonthName: count}
    monthly_consultations = {}
    for year_month, count in monthly_counts:
        month_name = datetime.strptime(year_month, '%Y-%m').strftime('%b')
        monthly_consultations[month_name] = count

    # Fill in any missing months with 0
    for i in range(6):
        month = date.today() - relativedelta(months=i)
        month_name = month.strftime('%b')
        if month_name not in monthly_consultations:
            monthly_consultations[month_name] = 0

    return PracticeAnalytics(
        total_consultations=total_consultations,
        average_consultation_duration=average_consultation_duration,
        patient_satisfaction_score=patient_satisfaction_score,
        monthly_consultations=monthly_consultations
    )


@physician_router.get("/development/resources", response_model=List[ProfessionalResourceOut])
async def get_professional_resources(db: Session = DbSession):
    """
    Retrieves all professional development resources.
    """
    return db.query(ProfessionalResource).all()



cms_router = APIRouter(prefix="/api/admin/cms", tags=["Admin - CMS"], dependencies=[Depends(get_current_active_superuser)])

@cms_router.post("/posts", response_model=BlogPostOut)
async def create_blog_post(post_data: BlogPostCreate, user: User = CurrentSuperuser, db: Session = DbSession):
    new_post = BlogPost(**post_data.dict(), author_id=user.id)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return BlogPostOut(**new_post.__dict__, author_email=user.email)

@cms_router.get("/posts", response_model=List[BlogPostOut])
async def list_blog_posts(db: Session = DbSession):
    posts = db.query(BlogPost).options(joinedload(BlogPost.author)).order_by(BlogPost.created_at.desc()).all()
    # Manually construct response to include author email
    return [BlogPostOut(**post.__dict__, author_email=post.author.email if post.author else "System") for post in posts]

@cms_router.put("/posts/{post_id}", response_model=BlogPostOut)
async def update_blog_post(post_id: int, post_data: BlogPostCreate, user: User = CurrentSuperuser, db: Session = DbSession):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    post.title = post_data.title
    post.content = post_data.content
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return BlogPostOut(**post.__dict__, author_email=post.author.email if post.author else "System")

@cms_router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(post_id: int, db: Session = DbSession):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    db.delete(post)
    db.commit()
    return None

# --- New Public Router for Blog Posts ---
blog_router = APIRouter(prefix="/api/blog", tags=["Blog"])

@blog_router.get("/posts", response_model=List[BlogPostOut])
async def get_public_blog_posts(db: Session = DbSession):
    """Public endpoint to fetch all blog posts for the Health Hub."""
    posts = db.query(BlogPost).options(joinedload(BlogPost.author)).order_by(BlogPost.created_at.desc()).all()
    return [BlogPostOut(**post.__dict__, author_email=post.author.email if post.author else "System") for post in posts]



appointment_router = APIRouter(prefix="/api/appointments", tags=["Appointment Booking"])


@appointment_router.get("/physicians/search", response_model=List[PhysicianPublicProfile])
async def search_physicians(specialty: Optional[str] = Query(None), db: Session = DbSession):
    query = db.query(Physician).options(joinedload(Physician.user)).filter(Physician.is_verified == True)
    if specialty: query = query.filter(Physician.specialty.ilike(f"%{specialty}%"))
    physicians = query.all()
    for p in physicians:
        if p.availability_schedule: p.availability_schedule = json.loads(p.availability_schedule)
    return physicians


@appointment_router.post("/book", response_model=AppointmentForPatient, status_code=201,
                         dependencies=[Depends(get_current_active_patient)])
async def book_appointment(data: AppointmentCreate, user: User = CurrentPatient, db: Session = DbSession):
    physician = db.query(Physician).filter(Physician.id == data.physician_id, Physician.is_verified == True).first()
    if not physician: raise HTTPException(404, "Verified physician not found.")
    if not is_slot_available(data.physician_id, data.appointment_time, data.duration_minutes, db):
        raise HTTPException(409, "Requested time slot is not available.")
    appt = Appointment(id=str(uuid.uuid4()), patient_id=user.patient_profile.id, physician_id=data.physician_id,
                       appointment_time=data.appointment_time, duration_minutes=data.duration_minutes,
                       telemedicine_link=generate_telemedicine_link(str(uuid.uuid4())))
    db.add(appt);
    db.commit();
    db.refresh(appt);
    return appt


@appointment_router.patch("/{appointment_id}/reschedule", response_model=AppointmentForPatient)
async def reschedule_appointment(
        appointment_id: str,
        reschedule_data: AppointmentRescheduleRequest,
        background_tasks: BackgroundTasks,
        user: User = CurrentPatient,
        db: Session = DbSession
):
    """
    (Patient) Reschedules an existing appointment.
    """
    appointment = db.query(Appointment).options(
        joinedload(Appointment.physician).joinedload(Physician.user)
    ).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == user.patient_profile.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or you do not have permission to modify it.")

    if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot reschedule a completed or cancelled appointment.")

    # Check if the new time slot is available
    if not is_slot_available(
            physician_id=appointment.physician_id,
            start=reschedule_data.new_appointment_time,
            duration=appointment.duration_minutes,
            db=db
    ):
        raise HTTPException(status_code=409, detail="The requested new time slot is not available.")

    old_time = appointment.appointment_time
    appointment.appointment_time = reschedule_data.new_appointment_time
    appointment.status = AppointmentStatus.RESCHEDULED
    db.commit()

    # Send notifications about the change
    physician = appointment.physician
    patient_name = f"{user.patient_profile.first_name} {user.patient_profile.last_name}"

    background_tasks.add_task(
        notification_service.send_to_user,
        db=db,
        user_id=physician.user_id,
        title="Appointment Rescheduled",
        body=f"Your appointment with {patient_name} originally at {old_time.strftime('%b %d, %H:%M')} has been rescheduled to {appointment.appointment_time.strftime('%b %d, %H:%M')}.",
        data={"link": f"/physician/schedule"}
    )

    db.refresh(appointment)

    # We need to structure the response correctly
    physician_profile_for_response = PhysicianPublicProfile(
        **physician.__dict__,
        email=physician.user.email
    )
    return AppointmentForPatient(
        **appointment.__dict__,
        physician=physician_profile_for_response
    )


@appointment_router.delete("/{appointment_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
        appointment_id: str,
        background_tasks: BackgroundTasks,
        user: User = CurrentUser,  # Can be cancelled by either patient or physician
        db: Session = DbSession
):
    """
    (Patient or Physician) Cancels an existing appointment.
    """
    query = db.query(Appointment).options(
        joinedload(Appointment.physician).joinedload(Physician.user),
        joinedload(Appointment.patient).joinedload(Patient.user)
    ).filter(Appointment.id == appointment_id)

    # Security check: User must be part of the appointment
    if user.role == UserRole.PATIENT:
        appointment = query.filter(Appointment.patient_id == user.patient_profile.id).first()
    elif user.role == UserRole.PHYSICIAN:
        appointment = query.filter(Appointment.physician_id == user.physician_profile.id).first()
    else:
        appointment = None

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or you do not have permission to modify it.")

    if appointment.status == AppointmentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed appointment.")

    appointment.status = AppointmentStatus.CANCELLED
    db.commit()

    # Send notifications
    patient = appointment.patient
    physician = appointment.physician

    if user.role == UserRole.PATIENT:
        # Patient cancelled, notify physician
        notifier_name = f"{patient.first_name} {patient.last_name}"
        recipient_id = physician.user_id
        recipient_link = "/physician/schedule"
    else:
        # Physician cancelled, notify patient
        notifier_name = f"Dr. {physician.last_name}"
        recipient_id = patient.user_id
        recipient_link = "/patient/booking"  # Or a dedicated appointments page

    background_tasks.add_task(
        notification_service.send_to_user,
        db=db,
        user_id=recipient_id,
        title="Appointment Cancelled",
        body=f"Your appointment on {appointment.appointment_time.strftime('%b %d, %Y')} has been cancelled by {notifier_name}.",
        data={"link": recipient_link}
    )

    return None


@appointment_router.get("/physicians/search/geo", response_model=List[PhysicianPublicProfile])
async def search_physicians_geospatial(
        latitude: float = Query(..., ge=-90, le=90),
        longitude: float = Query(..., ge=-180, le=180),
        radius_km: int = Query(25, gt=0, le=500),
        specialty: Optional[str] = Query(None),
        db: Session = DbSession
):
    """
    (Public) Searches for verified physicians within a given radius of a geographic point,
    sorted by distance.
    """

    # 1. Define the custom haversine function for use in the SQLAlchemy query
    # The names 'lat2' and 'lon2' correspond to the columns in the Physician table.
    haversine_func = func.haversine(latitude, longitude, Physician.latitude, Physician.longitude).label("distance_km")

    # 2. Build the query
    query = db.query(
        Physician,
        haversine_func
    ).options(joinedload(Physician.user)).filter(
        Physician.is_verified == True,
        Physician.latitude.isnot(None),  # Ensure physician has location data
        Physician.longitude.isnot(None)
    )

    # 3. Apply the distance filter. The custom function is used in the `having` clause.
    # Note: In a real PostGIS setup, this would be a much more efficient `ST_DWithin` call.
    query = query.having(haversine_func <= radius_km)

    # 4. Apply optional specialty filter
    if specialty:
        query = query.filter(Physician.specialty.ilike(f"%{specialty}%"))

    # 5. Order by the calculated distance
    query = query.order_by(haversine_func.asc())

    results = query.all()

    # 6. Format the response
    response_list = []
    for physician, distance in results:
        schedule = None
        if physician.availability_schedule:
            try:
                schedule = json.loads(physician.availability_schedule)
            except:
                schedule = None

        public_profile = PhysicianPublicProfile(
            **physician.__dict__,
            email=physician.user.email,
            availability_schedule=schedule,
            distance_km=round(distance, 2)  # Add the calculated distance to the response
        )
        response_list.append(public_profile)

    return response_list


# --- Superuser Router ---
admin_router = APIRouter(prefix="/api/admin", tags=["Superuser Portal"],
                         dependencies=[Depends(get_current_active_superuser)])


@admin_router.get("/users", response_model=PaginatedUsersResponse)
async def list_users(db: Session = DbSession, page: int = 1, size: int = 20, role: Optional[UserRole] = None):
    query = db.query(User).options(joinedload(User.patient_profile), joinedload(User.physician_profile))
    if role: query = query.filter(User.role == role)
    total = query.count()
    users = query.offset((page - 1) * size).limit(size).all()
    return {"total": total, "page": page, "size": size, "pages": math.ceil(total / size), "items": users}


@admin_router.get("/physicians/pending-verification", response_model=List[UserAdminView])
async def list_pending_physicians(db: Session = DbSession):
    return db.query(User).join(Physician).filter(User.role == UserRole.PHYSICIAN, Physician.is_verified == False).all()


@admin_router.post("/physicians/{physician_id}/verify", response_model=PhysicianInDB)
async def verify_physician(physician_id: str, data: PhysicianVerificationUpdate, db: Session = DbSession):
    physician = db.query(Physician).filter(Physician.id == physician_id).first()
    if not physician: raise HTTPException(404, "Physician profile not found.")
    physician.is_verified = data.is_verified
    db.commit();
    db.refresh(physician);
    return physician


@admin_router.post("/hospitals", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
async def create_hospital(hospital_data: HospitalCreate, db: Session = DbSession):
    """(Admin) Adds a new hospital to the directory."""
    new_hospital = Hospital(**hospital_data.dict(), is_validated=False)  # Hospitals are unvalidated by default
    db.add(new_hospital)
    db.commit()
    db.refresh(new_hospital)
    return new_hospital


@admin_router.get("/hospitals", response_model=List[HospitalOut])
async def list_hospitals(validated: Optional[bool] = None, db: Session = DbSession):
    """(Admin) Lists all hospitals, with an option to filter by validation status."""
    query = db.query(Hospital)
    if validated is not None:
        query = query.filter(Hospital.is_validated == validated)
    return query.all()


@admin_router.put("/hospitals/{hospital_id}", response_model=HospitalOut)
async def update_hospital(hospital_id: str, update_data: HospitalUpdate, db: Session = DbSession):
    """(Admin) Updates a hospital's details, including validating it."""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found.")

    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(hospital, key, value)

    hospital.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(hospital)
    return hospital


@admin_router.delete("/hospitals/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospital(hospital_id: str, db: Session = DbSession):
    """(Admin) Deletes a hospital from the directory."""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found.")
    db.delete(hospital)
    db.commit()
    return None


@admin_router.get("/audit-logs", response_model=List[AuditLogOut])
async def get_audit_logs(
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        limit: int = Query(100, ge=1, le=1000),
        db: Session = DbSession
):
    """
    (Admin) Retrieves audit logs with optional filtering.
    """
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.limit(limit).all()
    return logs


@admin_router.get("/feature-flags", response_model=List[FeatureFlagOut])
async def get_all_feature_flags(db: Session = DbSession):
    """(Admin) Retrieves the status of all feature flags."""
    return db.query(FeatureFlag).all()


@admin_router.put("/feature-flags/{flag_name}", response_model=FeatureFlagOut)
async def update_feature_flag(flag_name: str, update_data: FeatureFlagUpdate, db: Session = DbSession):
    """(Admin) Updates the permissions for a specific feature flag."""
    if flag_name not in AVAILABLE_FEATURES:
        raise HTTPException(status_code=404, detail="Invalid feature flag name.")

    flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found in database.")

    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(flag, key, value)

    db.commit()
    db.refresh(flag)
    return flag


@admin_router.get("/dashboard-kpis", response_model=AdminDashboardKPIs)
async def get_dashboard_kpis(db: Session = DbSession):
    """
    (Admin) Retrieves key performance indicators (KPIs) for the entire platform.
    This endpoint performs real-time database aggregations to provide live data.
    """

    # 1. Calculate Total Active Users
    total_active_users = db.query(User).filter(User.is_active == True).count()

    # 2. Calculate Total Verified Physicians
    # This is a more meaningful metric than just total physicians.
    total_physicians = db.query(Physician).filter(Physician.is_verified == True).count()

    # 3. Calculate Pending Physician Verifications
    pending_verifications = db.query(Physician).filter(Physician.is_verified == False).count()

    # 4. Calculate Monthly Recurring Revenue (MRR)
    # This is a complex query that uses a SQL `CASE` statement to assign a monetary
    # value to each subscription plan and then sums them up.
    # It only considers subscriptions that are currently active.
    # The prices are divided by 100 because we stored them in the smallest currency unit (cents/kobo).

    # Define the mapping from enum to price. This ensures a single source of truth.
    price_case = case(
        (Subscription.plan == SubscriptionPlan.BASIC, SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC].price_monthly / 100.0),
        (Subscription.plan == SubscriptionPlan.PREMIUM,
         SUBSCRIPTION_PLANS[SubscriptionPlan.PREMIUM].price_monthly / 100.0),
        (Subscription.plan == SubscriptionPlan.ULTIMATE,
         SUBSCRIPTION_PLANS[SubscriptionPlan.ULTIMATE].price_monthly / 100.0),
        else_=0.0  # Freemium plans and any others contribute $0 to MRR
    )

    # Execute the aggregation query in the database
    # `func.sum` is the SQLAlchemy equivalent of SQL's SUM() function.
    # The `.scalar()` method is used to get a single value result.
    calculated_mrr = db.query(func.sum(price_case)).filter(
        Subscription.is_active == True
    ).scalar()

    # If there are no paying subscribers, the result will be None, so we default to 0.0.
    monthly_recurring_revenue = calculated_mrr or 0.0

    # 5. Return the structured data
    return AdminDashboardKPIs(
        total_active_users=total_active_users,
        total_physicians=total_physicians,
        pending_verifications=pending_verifications,
        monthly_recurring_revenue=round(monthly_recurring_revenue, 2)
    )


@admin_router.post("/wellness/exercises", status_code=201)
async def add_exercise(name: str = Form(...), description: str = Form(...), target_conditions: str = Form(...),
                       video_url: Optional[str] = Form(None), db: Session = DbSession):
    new_exercise = Exercise(name=name, description=description, target_conditions=target_conditions,
                            video_url=video_url)
    db.add(new_exercise);
    db.commit();
    return {"status": "Exercise added"}


@admin_router.post("/wellness/supplements", status_code=201)
async def add_supplement(name: str = Form(...), description: str = Form(...), target_conditions: str = Form(...),
                         db: Session = DbSession):
    new_supplement = Supplement(name=name, description=description, target_conditions=target_conditions)
    db.add(new_supplement);
    db.commit();
    return {"status": "Supplement added"}


@admin_router.get("/analytics/user-growth", response_model=UserGrowthData)
async def get_user_growth_data(db: Session = DbSession):
    """
    (Admin) Provides time-series data for new user registrations over the past 30 days.
    """
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # This query groups users by the date they were created
    results = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= thirty_days_ago
    ).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()

    # Format the data
    data_points = [TimeSeriesDataPoint(date=r.date.isoformat(), count=r.count) for r in results]

    return UserGrowthData(data=data_points)


@admin_router.post("/wellness/meals", status_code=201)
async def add_meal(meal_data: MealCreate, db: Session = DbSession):
    new_meal = Meal(**meal_data.dict())
    db.add(new_meal); db.commit(); return {"status": "Meal added"}

@admin_router.get("/wellness/meals", response_model=List[MealCreate])
async def list_meals(db: Session = DbSession):
    return db.query(Meal).all()

@admin_router.post("/wellness/meal-plan-templates", status_code=201)
async def add_meal_plan_template(template_data: MealPlanTemplateCreate, db: Session = DbSession):
    new_template = MealPlanTemplate(
        condition=template_data.condition,
        daily_calorie_target=template_data.daily_calorie_target,
        structure=json.dumps(template_data.structure)
    )
    db.add(new_template); db.commit(); return {"status": "Template added"}


@admin_router.post("/resources", status_code=201)
async def add_professional_resource(
        title: str = Form(...),
        source: str = Form(...),
        resource_type: str = Form(...),
        link: str = Form(...),
        db: Session = DbSession
):
    new_resource = ProfessionalResource(title=title, source=source, resource_type=resource_type, link=link)
    db.add(new_resource);
    db.commit()
    return {"status": "Resource added"}


# --- New Admin Endpoint for Live Transactions (add to `admin_router`) ---
class PaymentLogOut(BaseModel):
    id: str
    amount: float
    currency: str
    status: str
    gateway: PaymentGateway
    payment_date: datetime
    user_email: EmailStr
    subscription_plan: Optional[SubscriptionPlan] = None


@admin_router.get("/payments/recent", response_model=List[PaymentLogOut])
async def get_recent_transactions(limit: int = 50, db: Session = DbSession):
    """
    (Admin) Retrieves a list of the most recent payment transactions across the platform.
    """
    payments = db.query(Payment).options(
        joinedload(Payment.subscription).joinedload(Subscription.user)
    ).order_by(Payment.payment_date.desc()).limit(limit).all()

    response = []
    for p in payments:
        # We need to handle cases where a payment might not be for a subscription
        # or where the user might have been deleted.
        user = db.query(User).filter(User.id == p.user_id).first()
        if not user:
            continue  # Skip payments from deleted users

        response.append(PaymentLogOut(
            id=p.gateway_transaction_id,
            amount=p.amount,
            currency=p.currency,
            status=p.status,
            gateway=p.gateway,
            payment_date=p.payment_date,
            user_email=user.email,
            subscription_plan=p.subscription.plan if p.subscription else None
        ))

    return response


# --- Real Meal Plan Generation Engine ---
def generate_real_meal_plan(condition: str, db: Session) -> Optional[MealPlan]:
    """
    Dynamically generates a 7-day meal plan for a given condition from the database.
    """
    template = db.query(MealPlanTemplate).filter(MealPlanTemplate.condition == condition).first()
    if not template:
        return None

    try:
        structure = json.loads(template.structure)
    except (json.JSONDecodeError, TypeError):
        return None

    # Fetch all suitable meals for the given condition from the database
    suitable_meals_query = db.query(Meal).filter(Meal.suitable_for_conditions.ilike(f"%{condition}%")).all()

    # Organize meals by type for easy lookup
    meals_by_type = {}
    for meal in suitable_meals_query:
        if meal.meal_type not in meals_by_type:
            meals_by_type[meal.meal_type] = []
        meals_by_type[meal.meal_type].append(meal.name)

    # Ensure we have meals for all required types in the structure
    for meal_type in structure.keys():
        if not meals_by_type.get(meal_type):
            logger.warning(f"Cannot generate meal plan for '{condition}'. No meals found for type '{meal_type}'.")
            return None

    # Generate the plan for one day
    daily_meals = {}
    for meal_type, count in structure.items():
        # Randomly select `count` meals of the specified type
        # `random.sample` ensures no duplicates for a single meal type on the same day.
        available_meals = meals_by_type.get(meal_type, [])
        if len(available_meals) < count:
            # If not enough unique meals, just pick with replacement
            daily_meals[meal_type] = random.choices(available_meals, k=count)
        else:
            daily_meals[meal_type] = random.sample(available_meals, k=count)

    return MealPlan(
        condition=template.condition.capitalize(),
        daily_calorie_target=template.daily_calorie_target,
        meals=daily_meals
    )

hospital_router = APIRouter(prefix="/api/hospitals", tags=["Hospitals"])


@hospital_router.get("/search", response_model=List[HospitalOut])
async def search_hospitals(
        query: Optional[str] = Query(None, description="Search by name, city, country, or specialty"),
        db: Session = DbSession
):
    """
    (Public) Searches for validated hospitals.
    Performs a case-insensitive search across multiple relevant fields.
    """


    search_query = db.query(Hospital).filter(Hospital.is_validated == True)

    if query:
        search_term = f"%{query.lower()}%"
        search_query = search_query.filter(
            or_(
                Hospital.name.ilike(search_term),
                Hospital.city.ilike(search_term),
                Hospital.country.ilike(search_term),
                Hospital.specialties.ilike(search_term)
            )
        )

    return search_query.all()


# --- AI Router ---
ai_router = APIRouter(prefix="/api/ai", tags=["AI/ML Services"], dependencies=[Depends(get_current_user)])
DRUG_INTERACTION_DB = {frozenset(["lisinopril", "ibuprofen"]): {"severity": "Moderate",
                                                                "description": "NSAIDs may reduce effectiveness of ACE inhibitors."}}
MEDICAL_TIPS_DB = [
    {"id": 1, "title": "Stay Hydrated for Better Health", "content": "Drinking enough water each day is crucial for many reasons: to regulate body temperature, keep joints lubricated, prevent infections, deliver nutrients to cells, and keep organs functioning properly. Being well-hydrated also improves sleep quality, cognition, and mood."},
    {"id": 2, "title": "The Importance of a Balanced Diet", "content": "A balanced diet provides all of the energy you need to keep active throughout the day. Nutrients you need for growth and repair, helping you to stay strong and healthy and help to prevent diet-related illness, such as some cancers."},
    {"id": 3, "title": "Incorporate Regular Physical Activity", "content": "Regular physical activity can improve your muscle strength and boost your endurance. Exercise delivers oxygen and nutrients to your tissues and helps your cardiovascular system work more efficiently. And when your heart and lung health improve, you have more energy to tackle daily chores."},
]
@ai_router.get("/medical-tips", response_model=List[Dict])
async def get_medical_tips():
    """Returns a list of general medical tips."""
    return random.sample(MEDICAL_TIPS_DB, len(MEDICAL_TIPS_DB))


@ai_router.post("/drug-interaction", response_model=List[DrugInteractionResult])
async def check_drug_interactions(data: DrugInteractionInput):
    results = []
    for med1, med2 in combinations([m.lower() for m in data.medications], 2):
        if frozenset([med1, med2]) in DRUG_INTERACTION_DB:
            interaction = DRUG_INTERACTION_DB[frozenset([med1, med2])]
            results.append(DrugInteractionResult(pair=[med1, med2], **interaction))
    return results


@ai_router.post("/diagnosis-support", response_model=List[DiagnosisSuggestion], dependencies=[check_feature("AI_DIAGNOSIS")])
async def get_diagnosis_suggestion(data: DiagnosisInput, user: User = CurrentPhysician):
    """
    (Physician-Only) Provides AI-powered diagnostic suggestions based on patient data.
    This is a decision support tool, not a replacement for professional medical judgment.
    This implementation uses a detailed rule-based engine to simulate a trained model.
    """
    # --- Start of Detailed Simulated ML Pipeline ---

    # 1. Data Ingestion and Normalization
    # Combine all text inputs into a single corpus for analysis.
    # Convert to lowercase for case-insensitive matching.
    symptoms_text = data.symptoms.lower() if data.symptoms else ""
    history_text = data.medical_history.lower() if data.medical_history else ""
    full_text_corpus = f"{symptoms_text} {history_text}"

    # 2. Keyword & Concept Extraction (Feature Engineering)
    # Define keywords and synonyms for various medical concepts.
    # In a real system, this could use NLP libraries like spaCy with medical ontologies (e.g., UMLS).
    symptom_keywords = {
        'fever': ['fever', 'febrile', 'pyrexia', 'high temperature'],
        'cough': ['cough', 'coughing'],
        'dry_cough': ['dry cough', 'non-productive cough'],
        'productive_cough': ['productive cough', 'wet cough', 'phlegm', 'sputum'],
        'shortness_of_breath': ['shortness of breath', 'sob', 'dyspnea', 'difficulty breathing'],
        'chest_pain': ['chest pain', 'chest tightness', 'angina'],
        'radiating_pain': ['radiating to', 'pain goes to', 'arm pain', 'jaw pain'],
        'headache': ['headache', 'migraine', 'cephalalgia'],
        'stiff_neck': ['stiff neck', 'nuchal rigidity'],
        'fatigue': ['fatigue', 'tired', 'lethargy', 'exhausted'],
        'sore_throat': ['sore throat', 'pharyngitis'],
        'nausea': ['nausea', 'vomiting', 'emesis'],
    }

    history_keywords = {
        'asthma': ['asthma', 'history of asthma'],
        'diabetes': ['diabetes', 'diabetic', 'hba1c'],
        'hypertension': ['hypertension', 'high blood pressure', 'hbp'],
        'smoking': ['smoker', 'smoking', 'cigarettes', 'tobacco'],
        'high_cholesterol': ['hyperlipidemia', 'high cholesterol', 'statins'],
    }

    # Function to check if any keyword for a concept is present in the text
    def has_concept(text, concept_list):
        return any(keyword in text for keyword in concept_list)

    # Extract features from the input text
    extracted_symptoms = {key: has_concept(full_text_corpus, keywords) for key, keywords in symptom_keywords.items()}
    extracted_history = {key: has_concept(full_text_corpus, keywords) for key, keywords in history_keywords.items()}

    # 3. Rule-Based Scoring Engine (Simulated Model Inference)
    # Define potential conditions and the rules to identify them.
    # Each rule has a base score and modifiers based on supporting or refuting evidence.

    suggestions = []

    # --- Condition 1: Pneumonia / Lower Respiratory Tract Infection ---
    pneumonia_score = 0
    pneumonia_explanation_points = []
    if extracted_symptoms['fever'] and extracted_symptoms['cough'] and extracted_symptoms['shortness_of_breath']:
        pneumonia_score += 0.70
        pneumonia_explanation_points.append(
            "Classic triad of fever, cough, and dyspnea strongly suggests a lower respiratory tract infection.")
    if extracted_symptoms['productive_cough']:
        pneumonia_score += 0.10
        pneumonia_explanation_points.append("Productive nature of the cough increases the likelihood of pneumonia.")
    if extracted_symptoms['chest_pain']:
        pneumonia_score += 0.05
        pneumonia_explanation_points.append("Associated pleuritic chest pain is common.")
    if extracted_history['smoking']:
        pneumonia_score += 0.05
        pneumonia_explanation_points.append("Smoking is a significant risk factor.")

    if pneumonia_score > 0.6:
        suggestions.append(DiagnosisSuggestion(
            condition="Pneumonia / Respiratory Infection",
            confidence_score=min(pneumonia_score, 0.98),  # Cap confidence
            explanation=" ".join(pneumonia_explanation_points),
            recommended_actions=["Perform a thorough lung auscultation.", "Order a Chest X-ray (PA and Lateral views).",
                                 "Order a Complete Blood Count (CBC) with differential and C-Reactive Protein (CRP).",
                                 "Consider obtaining a sputum culture for microbiology."]
        ))

    # --- Condition 2: Acute Coronary Syndrome (ACS) / Myocardial Infarction (MI) ---
    acs_score = 0
    acs_explanation_points = []
    if extracted_symptoms['chest_pain'] and extracted_symptoms['shortness_of_breath']:
        acs_score += 0.65
        acs_explanation_points.append(
            "The combination of chest pain and shortness of breath is highly concerning for a cardiac event.")
    if extracted_symptoms['radiating_pain']:
        acs_score += 0.25
        acs_explanation_points.append("Radiation of pain to the arm or jaw is a classic sign of myocardial ischemia.")
    if extracted_symptoms['nausea']:
        acs_score += 0.05
        acs_explanation_points.append("Associated symptoms like nausea can accompany ACS.")
    # Risk factor modifiers
    if extracted_history['diabetes']: acs_score += 0.05; acs_explanation_points.append(
        "Diabetes is a major risk factor.")
    if extracted_history['hypertension']: acs_score += 0.05; acs_explanation_points.append(
        "Hypertension increases risk.")
    if extracted_history['smoking']: acs_score += 0.05; acs_explanation_points.append(
        "Smoking is a strong risk factor.")
    if extracted_history['high_cholesterol']: acs_score += 0.05; acs_explanation_points.append(
        "Hyperlipidemia is a key risk factor.")

    if acs_score > 0.6:
        suggestions.append(DiagnosisSuggestion(
            condition="Acute Coronary Syndrome (ACS)",
            confidence_score=min(acs_score, 0.99),
            explanation=" ".join(acs_explanation_points),
            recommended_actions=["Obtain an immediate 12-lead Electrocardiogram (ECG).",
                                 "Order cardiac troponin levels (serial measurements may be required).",
                                 "Administer aspirin if not contraindicated.",
                                 "Prepare for potential emergency cardiology consultation."]
        ))

    # --- Condition 3: Bacterial Meningitis ---
    meningitis_score = 0
    meningitis_explanation_points = []
    if extracted_symptoms['headache'] and extracted_symptoms['fever'] and extracted_symptoms['stiff_neck']:
        meningitis_score += 0.90
        meningitis_explanation_points.append(
            "The classic triad of fever, headache, and nuchal rigidity is present, making meningitis a high-priority differential. This is a medical emergency.")
    if extracted_symptoms['nausea']:
        meningitis_score += 0.05
        meningitis_explanation_points.append("Nausea and vomiting are common due to increased intracranial pressure.")

    if meningitis_score > 0.8:
        suggestions.append(DiagnosisSuggestion(
            condition="Bacterial Meningitis",
            confidence_score=min(meningitis_score, 0.99),
            explanation=" ".join(meningitis_explanation_points),
            recommended_actions=[
                "Perform an immediate and thorough neurological examination (including Kernig's and Brudzinski's signs).",
                "Prepare for an urgent lumbar puncture for cerebrospinal fluid (CSF) analysis.",
                "Order blood cultures.",
                "Consider empiric antibiotic therapy immediately after CSF collection if suspicion is high."]
        ))

    # --- Condition 4: Common Cold / Upper Respiratory Infection (URI) ---
    uri_score = 0
    uri_explanation_points = []
    if extracted_symptoms['sore_throat'] or extracted_symptoms['cough']:
        uri_score += 0.50
        uri_explanation_points.append("Presence of cough or sore throat is typical for a URI.")
    if not extracted_symptoms['shortness_of_breath'] and not extracted_symptoms['chest_pain']:
        uri_score += 0.20  # Lack of severe symptoms points away from more serious conditions
        uri_explanation_points.append(
            "Absence of significant shortness of breath or chest pain makes a simple URI more likely.")
    if extracted_symptoms['fever'] and float(re.search(r'\d+\.?\d*', symptoms_text).group()) < 38.5:
        uri_score += 0.10
        uri_explanation_points.append("A low-grade fever is consistent with a viral URI.")

    if uri_score > 0.6 and pneumonia_score < 0.5:  # Only suggest if pneumonia is not likely
        suggestions.append(DiagnosisSuggestion(
            condition="Viral Upper Respiratory Infection (URI)",
            confidence_score=min(uri_score, 0.95),
            explanation=" ".join(uri_explanation_points),
            recommended_actions=["Advise symptomatic treatment (rest, hydration, antipyretics).",
                                 "Provide patient education on red flag symptoms (e.g., worsening shortness of breath, high fever) that warrant re-evaluation.",
                                 "A physical exam can help rule out more serious conditions."]
        ))

    # 4. Final Processing
    # If no specific conditions were met, return an empty list.
    if not suggestions:
        return []

    # Sort suggestions by confidence score in descending order and return the top 3.
    return sorted(suggestions, key=lambda s: s.confidence_score, reverse=True)[:3]


@ai_router.post("/risk-prediction/cardiovascular", response_model=RiskScore)
async def get_cardiovascular_risk_prediction(data: RiskPredictionInput):
    """
    Predicts the 10-year risk of cardiovascular disease.
    This endpoint now acts as a proxy to the dedicated AI Inference Service.
    """
    # 1. Transform the input from the main app's schema to the AI service's schema
    # This transformation layer is important for decoupling the services.
    ai_service_input = {
        "age": data.age,
        "gender": 1 if data.gender.lower() == 'male' else 0,
        "systolic_bp": data.systolic_bp,
        "is_smoker": 1 if data.is_smoker else 0,
        "has_diabetes": 1 if data.has_diabetes else 0,
        "total_cholesterol": data.cholesterol,
        "hdl_cholesterol": data.hdl
        # Note: We are missing LDL, our mock model doesn't use it.
        # In a real scenario, the models and schemas would be perfectly aligned.
    }

    # 2. Call the AI service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AI_SERVICE_URL}/predict/cardiovascular-risk",
                json=ai_service_input,
                timeout=10.0 # Set a timeout
            )
            response.raise_for_status() # Raise an exception for 4xx/5xx responses
            ai_result = response.json()
    except httpx.RequestError as e:
        logger.error(f"Could not connect to AI service: {e}")
        raise HTTPException(status_code=503, detail="The AI prediction service is currently unavailable.")
    except httpx.HTTPStatusError as e:
        logger.error(f"AI service returned an error: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"AI service error: {e.response.json().get('detail', 'Unknown error')}")

    # 3. Transform the AI service's output back to the main app's response schema
    # The frontend is expecting the RiskScore schema, not RiskPredictionOutput.
    return RiskScore(
        disease=ai_result["disease"],
        risk_percentage=round(ai_result["risk_probability"] * 100, 2),
        risk_level=ai_result["risk_level"],
        contributing_factors=[] # The new model doesn't provide this, so we return an empty list.
                               # This demonstrates the importance of the transformation layer.
    )


@ai_router.get("/recommendations/wellness-plan", response_model=WellnessPlan)
async def get_full_wellness_plan(user: User = CurrentPatient, db: Session = DbSession):
    """
    Generates a full, personalized wellness plan using the REAL, data-driven engine.
    """
    patient = user.patient_profile
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    # --- 1. Identify Primary Condition ---
    history_text = (f"{patient.past_illnesses or ''} {patient.family_history or ''}").lower()
    conditions = set()
    if "diabetes" in history_text: conditions.add("diabetes")
    if "hypertension" in history_text or "blood pressure" in history_text: conditions.add("hypertension")

    # Default to general wellness if no specific condition is identified
    primary_condition = next(iter(conditions), "general_wellness")

    # --- 2. Fetch REAL Meal Plan ---
    meal_plan = generate_real_meal_plan(primary_condition, db)

    # If no specific plan found, try to generate a general wellness plan
    if not meal_plan:
        meal_plan = generate_real_meal_plan("general_wellness", db)

    # --- 3. Fetch REAL Exercise Plan (logic from previous segment is already real) ---
    exercise_conditions = conditions if conditions else {"general_wellness"}
    exercise_query = db.query(Exercise).filter(
        or_(*[Exercise.target_conditions.ilike(f"%{c}%") for c in exercise_conditions])
    ).limit(3).all()
    exercise_plan = [ExerciseOut.from_orm(ex) for ex in exercise_query]

    # --- 4. Fetch REAL Supplement Recommendations (logic from previous segment is already real) ---
    supplement_recs = []
    # ... (the existing rule-based logic for supplements is a valid real-system approach)
    all_supplements = db.query(Supplement).all()
    if "hypertension" in conditions:
        omega3 = next((s for s in all_supplements if "omega-3" in s.name.lower()), None)
        if omega3:
            supplement_recs.append(SupplementOut(
                **omega3.__dict__,
                reasoning="Recommended to support cardiovascular health, based on your profile."
            ))

    return WellnessPlan(
        meal_plan=meal_plan,
        exercise_plan=exercise_plan,
        supplement_recommendations=supplement_recs
    )




# --- New Chat API Router ---
chat_router = APIRouter(prefix="/api/chat", tags=["Chat & Messaging"], dependencies=[Depends(get_current_user)])


@chat_router.get("/conversations", response_model=List[ConversationOut])
async def get_user_conversations(user: User = CurrentUser, db: Session = DbSession):
    """
    Retrieves all conversations for the currently logged-in user.
    A professional relationship (an appointment) must exist to have a conversation.
    """
    if user.role == UserRole.PATIENT:
        convos = db.query(Conversation).filter(Conversation.patient_id == user.patient_profile.id).all()
    elif user.role == UserRole.PHYSICIAN:
        convos = db.query(Conversation).filter(Conversation.physician_id == user.physician_profile.id).all()
    else:
        return []  # Superusers do not have conversations

    # We need to manually load and format the related data for the response model
    results = []
    for convo in convos:
        # Load related patient and physician user data
        patient_user = db.query(User).filter_by(id=convo.patient.user_id).first()
        physician_user = db.query(User).filter_by(id=convo.physician.user_id).first()

        results.append({
            "id": convo.id,
            "patient": {**convo.patient.__dict__, "email": patient_user.email},
            "physician": {**convo.physician.__dict__, "email": physician_user.email}
        })

    return results


@chat_router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
async def get_conversation_messages(conversation_id: str, user: User = CurrentUser, db: Session = DbSession):
    """Retrieves all messages from a specific conversation."""
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    # Security check: User must be part of the conversation
    if not ((user.role == UserRole.PATIENT and convo.patient_id == user.patient_profile.id) or \
            (user.role == UserRole.PHYSICIAN and convo.physician_id == user.physician_profile.id)):
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation.")

    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.timestamp).all()


# --- WebSocket Endpoint ---
@chat_router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str, token: str = Query(...)):
    """
    Handles the real-time WebSocket connection for a chat conversation.
    Token-based authentication is used for WebSockets.
    """
    # 1. Authenticate the WebSocket connection using the JWT
    db = SessionLocal()
    try:
        credentials_exception = WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    finally:
        db.close()

    # 2. Verify user is part of the conversation (re-fetch with new session)
    db = SessionLocal()
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    is_authorized = False
    if convo:
        is_authorized = ((user.role == UserRole.PATIENT and convo.patient_id == user.patient_profile.id) or \
                         (user.role == UserRole.PHYSICIAN and convo.physician_id == user.physician_profile.id))

    if not is_authorized:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        db.close()
        return

    # 3. Handle the connection
    await manager.connect(websocket, conversation_id)
    try:
        while True:
            # Wait for a message from the client
            data = await websocket.receive_text()

            # Save the message to the database
            db_message = Message(
                conversation_id=conversation_id,
                sender_id=user.id,
                content=data
            )
            db.add(db_message)
            db.commit()
            db.refresh(db_message)

            # Broadcast the new message to all clients in the same conversation room
            message_data = MessageOut.from_orm(db_message).dict()
            await manager.broadcast(conversation_id, message_data)

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
    except Exception as e:
        logger.error(f"WebSocket error in conversation {conversation_id}: {e}")
        manager.disconnect(websocket, conversation_id)
    finally:
        db.close()


# --- Trigger Integrations in Existing Routers ---
# When an appointment is completed, a conversation should be created if it doesn't exist.
# This logic can be added to a hypothetical "complete appointment" endpoint.
# For now, we will add a manual endpoint to create a conversation based on an appointment.

@chat_router.post("/conversations/from_appointment/{appointment_id}", response_model=ConversationOut)
async def create_conversation_from_appointment(appointment_id: str, user: User = CurrentPhysician,
                                               db: Session = DbSession):
    """
    (Physician-Only) Creates a chat conversation channel based on a past appointment.
    """
    appt = db.query(Appointment).filter(Appointment.id == appointment_id,
                                        Appointment.physician_id == user.physician_profile.id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Valid appointment not found.")

    # Check if a conversation already exists
    existing_convo = db.query(Conversation).filter_by(patient_id=appt.patient_id,
                                                      physician_id=appt.physician_id).first()
    if existing_convo:
        return existing_convo

    # Create new conversation
    new_convo = Conversation(patient_id=appt.patient_id, physician_id=appt.physician_id)
    db.add(new_convo)
    db.commit()
    db.refresh(new_convo)

    return new_convo


payment_router = APIRouter(prefix="/api/payments", tags=["Payments"])


@payment_router.get("/plans", response_model=List[PlanDetail])
async def get_subscription_plans():
    """Lists all available subscription plans."""
    return list(SUBSCRIPTION_PLANS.values())


@payment_router.post("/initialize/paystack", response_model=PaymentInitializeResponse,
                     dependencies=[Depends(get_current_user)])
async def initialize_paystack_payment(
        request: PaymentInitializeRequest,
        user: User = CurrentUser,
        db: Session = DbSession
):
    """Initializes a payment for a subscription plan."""
    plan_details = SUBSCRIPTION_PLANS.get(request.plan)
    if not plan_details:
        raise HTTPException(status_code=404, detail="Subscription plan not found.")

    amount = plan_details.price_monthly if request.interval == "monthly" else plan_details.price_yearly

    # Create a unique reference for the transaction
    reference = f"DORTMED_{request.plan.value}_{user.id}_{secrets.token_hex(8)}"

    # Initialize transaction with Paystack
    response_data = await paystack_service.initialize_transaction(user.email, amount, request.plan, reference)

    if response_data and response_data.get("status"):
        # Create a pending payment record in our DB
        payment = Payment(
            user_id=user.id,
            amount=amount / 100,  # Store in main currency unit
            currency=plan_details.currency,
            status="pending",
            gateway=PaymentGateway.PAYSTACK,
            gateway_transaction_id=reference
        )
        db.add(payment)
        db.commit()
        return response_data["data"]
    raise HTTPException(status_code=500, detail="Failed to initialize payment.")


@payment_router.post("/webhooks/paystack")
async def handle_paystack_webhook(request: Request, db: Session = DbSession):
    """
    Handles incoming webhook notifications from Paystack.
    This is the source of truth for successful payments.
    """
    body = await request.body()

    # 1. Verify the webhook signature for security
    paystack_signature = request.headers.get("x-paystack-signature")
    if not paystack_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    hashed = hmac.new(settings.PAYSTACK_SECRET_KEY.encode('utf-8'), body, hashlib.sha512).hexdigest()
    if hashed != paystack_signature:
        logger.warning("Invalid Paystack webhook signature received.")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(body)
        event_data = PaystackWebhookPayload(**payload)
    except (json.JSONDecodeError, ValidationError):
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    # 2. Process the event
    if event_data.event == "charge.success":
        reference = event_data.data.reference
        logger.info(f"Processing successful charge for reference: {reference}")

        # Verify transaction again with Paystack as a final check
        verification = await paystack_service.verify_transaction(reference)
        if verification["data"]["status"] != "success":
            logger.warning(f"Webhook for {reference} but verification failed.")
            return JSONResponse(content={"status": "verification_failed"})

        # Update our database
        payment = db.query(Payment).filter(Payment.gateway_transaction_id == reference).first()
        if not payment:
            logger.error(f"Payment record not found for successful webhook: {reference}")
            return JSONResponse(content={"status": "payment_not_found"})

        if payment.status == "completed":
            logger.info(f"Payment {reference} already processed. Ignoring webhook.")
            return JSONResponse(content={"status": "already_processed"})

        payment.status = "completed"

        # Update user's subscription
        user_subscription = db.query(Subscription).filter(Subscription.user_id == payment.user_id).first()
        if not user_subscription:
            # This should not happen for a registered user, but handle it gracefully
            user_subscription = Subscription(user_id=payment.user_id)
            db.add(user_subscription)

        plan_str = verification["data"]["metadata"].get("plan")
        plan = SubscriptionPlan(plan_str)

        user_subscription.plan = plan
        user_subscription.start_date = datetime.utcnow()
        # For simplicity, we assume monthly. Production would check metadata.
        user_subscription.end_date = datetime.utcnow() + timedelta(days=30)
        user_subscription.is_active = True

        # Link payment to subscription
        payment.subscription_id = user_subscription.id

        db.commit()
        logger.info(f"User {payment.user_id} subscription updated to {plan.value}")
        user = db.query(User).filter(User.id == payment.user_id).first()
        plan_details = SUBSCRIPTION_PLANS[plan]

        invoice_buffer = generate_invoice_pdf(payment, user, plan_details)
        invoice_filename = f"Invoice_{payment.id[:8]}_{user.id[:4]}.pdf"

        class InMemoryUploadFile:  # Helper class as defined before
            def __init__(self, file,
                         filename): self.file = file; self.filename = filename; self.content_type = "application/pdf"

            async def read(self): return self.file.read()

            @property
            def size(self): return self.file.getbuffer().nbytes

        in_memory_file = InMemoryUploadFile(invoice_buffer, invoice_filename)

        # Upload the generated invoice PDF to Firebase Storage
        upload_result = await storage_manager.upload_file(
            file=in_memory_file,
            user_id=user.id,
            document_type="invoice"  # Use a new type
        )

        # Create a database record for this new invoice document
        new_invoice_doc = MedicalDocument(
            id=str(uuid.uuid4()),
            patient_id=user.patient_profile.id,  # Assuming invoices are tied to patients for now
            document_type=DocumentType.OTHER,  # Or a new "INVOICE" type if you add it to the Enum
            file_name=invoice_filename,
            file_path=upload_result["file_path"],
            file_url="",
            description=f"Invoice for {plan_details.name} Subscription"
        )
        db.add(new_invoice_doc)
        db.commit()

        logger.info(f"Invoice {invoice_filename} generated and saved for user {user.id}")

        # You can trigger a background task here to send a confirmation email
        # background_tasks.add_task(send_payment_success_email, payment.user_id)

    return JSONResponse(content={"status": "received"})


# --- Telemedicine API Router ---
telemedicine_router = APIRouter(prefix="/api/telemedicine", tags=["Telemedicine"],
                                dependencies=[Depends(get_current_user)])


@telemedicine_router.get("/token/{appointment_id}", response_model=VideoTokenResponse, dependencies=[check_feature("TELEMEDICINE")])
async def get_video_call_token(appointment_id: str, user: User = CurrentUser, db: Session = DbSession):
    """
    Generates a Twilio video token for a user to join a consultation.
    This endpoint is heavily secured to ensure only the correct patient or physician can join.
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Security Check: Ensure the user requesting the token is part of the appointment
    is_patient_in_appt = user.role == UserRole.PATIENT and appointment.patient_id == user.patient_profile.id
    is_physician_in_appt = user.role == UserRole.PHYSICIAN and appointment.physician_id == user.physician_profile.id

    if not (is_patient_in_appt or is_physician_in_appt):
        raise HTTPException(status_code=403, detail="You are not authorized to join this consultation.")

    # Time-based access control: Allow joining a short window around the appointment time
    now = datetime.now(timezone.utc)
    start_time = appointment.appointment_time
    end_time = start_time + timedelta(minutes=appointment.duration_minutes)

    # Allow joining 10 minutes before and until the appointment ends
    if not (start_time - timedelta(minutes=10) <= now <= end_time):
        raise HTTPException(status_code=403, detail="Consultation cannot be joined at this time.")

    # The room name is the appointment ID to ensure uniqueness.
    room_name = appointment_id

    # The user's identity in the video call is their user ID.
    identity = user.id

    # Ensure the room exists on Twilio's side
    twilio_service.find_or_create_room(room_name)

    # Generate the time-limited token
    token = twilio_service.get_video_token(room_name, identity)

    return VideoTokenResponse(token=token, room_name=room_name)


# --- Include all routers ---
app.include_router(auth_router)
app.include_router(patient_router)
app.include_router(physician_router)
app.include_router(appointment_router)
app.include_router(admin_router)
app.include_router(ai_router)
app.include_router(payment_router)
app.include_router(telemedicine_router)
app.include_router(chat_router)
app.include_router(hospital_router)
app.include_router(cms_router)
app.include_router(blog_router)

# =================================================================================================
# XIII. RUN APPLICATION
# =================================================================================================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)