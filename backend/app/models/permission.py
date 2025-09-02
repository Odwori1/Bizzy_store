from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

# Association table for the many-to-many relationship between roles and permissions
role_permission = Table(
    'role_permission',
    Base.metadata,
    Column('role_id', ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', ForeignKey('permissions.id'), primary_key=True)
)

# Association table for the many-to-many relationship between users and roles
user_role = Table(
    'user_role',
    Base.metadata,
    Column('user_id', ForeignKey('users.id'), primary_key=True),
    Column('role_id', ForeignKey('roles.id'), primary_key=True)
)

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # e.g., "product:create"
    description = Column(String(255))  # e.g., "Allows creating new products"

    # Relationship to roles
    roles = relationship("Role", secondary=role_permission, back_populates="permissions")

    def __repr__(self):
        return f"<Permission {self.name}>"

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "Owner", "Manager", "Cashier"
    description = Column(String(255))  # e.g., "Has full access to all features"
    is_default = Column(Boolean, default=False)  # For auto-assigning roles like 'Cashier' to new users

    # Relationships
    permissions = relationship("Permission", secondary=role_permission, back_populates="roles")
    users = relationship("User", secondary=user_role, back_populates="roles")

    def __repr__(self):
        return f"<Role {self.name}>"
