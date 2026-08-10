from sqlalchemy import text

from database import engine, Base


def migrate():

    # ---------------------------------------------------------
    # IMPORTANT:
    # Import ALL models so SQLAlchemy knows about the
    # users table and the foreign-key relationships.
    # ---------------------------------------------------------

    from models.user import User
    from models.watchlist import Watchlist
    from models.portfolio import Portfolio
    from models.alert import Alert

    print("Dropping old user-specific tables...")

    with engine.begin() as connection:

        connection.execute(
            text("DROP TABLE IF EXISTS alerts CASCADE")
        )

        connection.execute(
            text("DROP TABLE IF EXISTS portfolio CASCADE")
        )

        connection.execute(
            text("DROP TABLE IF EXISTS watchlist CASCADE")
        )

    print("Old tables deleted.")

    print("Creating new tables...")

    # Create ONLY the three new tables.
    #
    # The users table is intentionally NOT dropped.
    # It must already exist because your authentication
    # system uses it.

    Base.metadata.create_all(
        bind=engine,
        tables=[
            Watchlist.__table__,
            Portfolio.__table__,
            Alert.__table__,
        ]
    )

    print("New tables created successfully.")


if __name__ == "__main__":
    migrate()