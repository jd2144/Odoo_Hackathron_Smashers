from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime

class BookingCreate(BaseModel):
    asset_id: str
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None

    @model_validator(mode='after')
    def check_dates(self) -> 'BookingCreate':
        if self.start_time >= self.end_time:
            raise ValueError('start_time must be before end_time')
        return self

class BookingResponse(BaseModel):
    id: str
    asset_id: str
    employee_id: str
    start_time: datetime
    end_time: datetime
    status: str
    purpose: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
