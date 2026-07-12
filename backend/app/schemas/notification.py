from pydantic import BaseModel
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True
