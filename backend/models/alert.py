from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    BigInteger,
    ForeignKey
)

from database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    symbol = Column(
        String,
        nullable=False,
        index=True
    )

    condition = Column(
        String,
        nullable=False
    )

    target_price = Column(
        Float,
        nullable=False
    )

    triggered = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        BigInteger,
        nullable=False
    )