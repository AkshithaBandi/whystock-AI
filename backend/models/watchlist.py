from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint

from database import Base


class Watchlist(Base):
    __tablename__ = "watchlist"

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
        String(20),
        nullable=False,
        index=True
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "symbol",
            name="unique_user_watchlist_symbol"
        ),
    )