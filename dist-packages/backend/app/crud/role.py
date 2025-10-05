from sqlalchemy.orm import Session, joinedload
from app.models.permission import Role
from app.models.permission import Permission

def get_role(db: Session, role_id: int):
    return db.query(Role).filter(Role.id == role_id).first()

def get_role_by_name(db: Session, name: str):
    return db.query(Role).filter(Role.name == name).first()

def get_roles(db: Session):
    """Get all roles from the database, eager loading their permissions."""
    return db.query(Role).options(joinedload(Role.permissions)).all()

# Note: We don't need create/update/delete for roles in this phase if we're just using pre-defined ones.
