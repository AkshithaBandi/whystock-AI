from sqlalchemy import Column, Integer, String, UniqueConstraint

from database import Base


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("symbol", name="unique_watchlist_symbol"),
    )