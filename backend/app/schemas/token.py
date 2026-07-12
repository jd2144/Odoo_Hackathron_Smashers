from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    success: bool = True
    token: str
    user: dict

class TokenPayload(BaseModel):
    sub: Optional[str] = None
