import uuid
from sqlalchemy.orm import Session
from app.models.notification import Notification, ActivityLog

def create_notification(db: Session, user_id: str, title: str, message: str) -> Notification:
    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        title=title,
        message=message
    )
    db.add(notif)
    return notif

def log_activity(db: Session, user_id: str, action: str, entity_type: str, entity_id: str, details: str = None) -> ActivityLog:
    log = ActivityLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(log)
    return log
