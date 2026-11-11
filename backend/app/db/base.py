import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, Uuid, Boolean, Column
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class BaseModel(Base):
    __abstract__ = True
    
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

class TenantScopedModel(BaseModel):
    __abstract__ = True
    
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        nullable=False,
        index=True
    )
