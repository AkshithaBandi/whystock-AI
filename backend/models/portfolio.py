from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    BigInteger,
    ForeignKey
)

from database import Base


class Portfolio(Base):
    __tablename__ = "portfolio"

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

    quantity = Column(
        Float,
        nullable=False
    )

    buy_price = Column(
        Float,
        nullable=False
    )

    added_at = Column(
        BigInteger,
        nullable=False
    )