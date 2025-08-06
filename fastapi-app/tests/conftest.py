import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db
from config import SQLALCHEMY_DATABASE_URL, Base
import os

# Use a test database with a different name
TEST_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
    os.getenv("POSTGRES_DB"), f"{os.getenv('POSTGRES_DB')}_test"
)


@pytest.fixture(scope="module")
def test_db():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture(scope="module")
def test_client(test_db):
    # Override the database dependency for testing
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
