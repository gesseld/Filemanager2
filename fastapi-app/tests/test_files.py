import pytest
from fastapi import status
from models.file import File
from schemas.file import FileCreate
from sqlalchemy.orm import Session


def test_create_file(test_client, test_db: Session):
    file_data = {"name": "test_file.txt", "size": 1024, "file_type": "text/plain"}
    response = test_client.post("/files/", json=file_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == file_data["name"]

    # Verify record exists in database
    db_file = test_db.query(File).filter(File.id == data["id"]).first()
    assert db_file is not None
    assert db_file.name == file_data["name"]


def test_get_files(test_client, test_db: Session):
    # First create a test file
    test_db.add(File(name="test1.txt", size=100, file_type="text/plain"))
    test_db.commit()

    response = test_client.get("/files/")
    assert response.status_code == status.HTTP_200_OK
    files = response.json()
    assert isinstance(files, list)
    assert len(files) > 0


def test_get_file(test_client, test_db: Session):
    # Create file directly in db
    db_file = File(name="test_get.txt", size=512, file_type="text/plain")
    test_db.add(db_file)
    test_db.commit()
    test_db.refresh(db_file)

    response = test_client.get(f"/files/{db_file.id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == db_file.id
