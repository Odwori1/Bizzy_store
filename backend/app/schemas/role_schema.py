from pydantic import BaseModel
from typing import List, Optional

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    is_default: bool
    permissions: List[str] = []  # List of permission names

    class Config:
        from_attributes = True
