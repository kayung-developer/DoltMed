import os
import sys
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# --- Add the project root to the Python path ---
# This allows us to import from `main` to access models and services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import (
    Appointment, User, NotificationService, get_db, AppSettings,
    Subscription, FCMDevice, Base
)

# Load settings to get the database URL
settings = AppSettings()

# --- Standalone Database Connection for the Scheduler ---
# The scheduler runs in a separate process, so it needs its own DB connection.
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Instantiate the notification service
notification_service = NotificationService()


# --- The Core Job Function ---
def send_appointment_reminders():
    """
    This is the main function that will be run on a schedule.
    It finds upcoming appointments and sends reminders.
    """
    db = SessionLocal()
    print(f"[{datetime.now()}] Running appointment reminder job...")

    try:
        # Define the time window for reminders (e.g., between 24 and 25 hours from now)
        # This prevents sending the same reminder multiple times if the job runs frequently.
        now = datetime.now(timezone.utc)
        reminder_start_window = now + timedelta(hours=24)
        reminder_end_window = reminder_start_window + timedelta(hours=1)  # Job runs hourly

        # Find appointments within this window that haven't been reminded yet.
        # We would add a `reminder_sent_at` column to the Appointment model for a 100% robust system.
        # For this implementation, we will just query the time window.
        upcoming_appointments = db.query(Appointment).filter(
            Appointment.appointment_time >= reminder_start_window,
            Appointment.appointment_time < reminder_end_window
        ).all()

        if not upcoming_appointments:
            print("No upcoming appointments found in the reminder window.")
            return

        print(f"Found {len(upcoming_appointments)} appointments to remind.")

        for appt in upcoming_appointments:
            patient = appt.patient
            physician = appt.physician

            appt_time_str = appt.appointment_time.strftime('%b %d at %I:%M %p UTC')

            # Send reminder to the patient
            notification_service.send_to_user(
                db=db,
                user_id=patient.user_id,
                title="Appointment Reminder",
                body=f"Your appointment with Dr. {physician.last_name} is tomorrow, {appt_time_str}.",
                data={"link": f"/patient/appointments"}
            )

            # Send reminder to the physician
            notification_service.send_to_user(
                db=db,
                user_id=physician.user_id,
                title="Appointment Reminder",
                body=f"Your appointment with {patient.first_name} {patient.last_name} is tomorrow, {appt_time_str}.",
                data={"link": f"/physician/schedule"}
            )

        print(f"Sent {len(upcoming_appointments)} reminders successfully.")

    except Exception as e:
        print(f"An error occurred during the reminder job: {e}")
    finally:
        db.close()


# --- Main Scheduler Execution ---
if __name__ == "__main__":
    # Ensure Firebase is initialized (required by NotificationService)
    # This logic should be extracted into a shared utility if the app grows.
    import firebase_admin
    from firebase_admin import credentials

    if not firebase_admin._apps:
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized for scheduler.")
        else:
            print(f"FATAL: Firebase credentials not found at: {settings.FIREBASE_CREDENTIALS_PATH}")
            sys.exit(1)

    scheduler = BlockingScheduler(timezone="UTC")

    # Schedule the job to run once every hour, at the start of the hour.
    scheduler.add_job(send_appointment_reminders, 'cron', hour='*')

    # You could also run it more frequently, e.g., every 5 minutes:
    # scheduler.add_job(send_appointment_reminders, 'interval', minutes=5)

    print("Scheduler started. Press Ctrl+C to exit.")

    try:
        # Run the initial job immediately for testing
        send_appointment_reminders()
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass