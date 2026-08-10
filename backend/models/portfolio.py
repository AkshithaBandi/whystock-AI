from sqlalchemy import Column, Integer, String, Float, BigInteger

from database import Base


class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, index=True)

    symbol = Column(String, nullable=False, index=True)

    quantity = Column(Float, nullable=False)

    buy_price = Column(Float, nullable=False)

    added_at = Column(BigInteger, nullable=False)