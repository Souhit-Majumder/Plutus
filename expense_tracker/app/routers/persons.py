from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.person import create_person, delete_person, get_person, get_persons, update_person
from app.schemas.person import PersonCreate, PersonResponse, PersonUpdate

router = APIRouter(prefix="/api/persons", tags=["Persons"])


@router.get("/", response_model=List[PersonResponse])
def list_persons(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """List all contacts (people you track loans with)."""
    return get_persons(db, current_user.id)


@router.post("/", response_model=PersonResponse, status_code=201)
def create(data: PersonCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_person(db, data, current_user.id)


@router.get("/{person_id}", response_model=PersonResponse)
def get_one(person_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    person = get_person(db, person_id, current_user.id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.put("/{person_id}", response_model=PersonResponse)
def update(person_id: int, data: PersonUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    person = get_person(db, person_id, current_user.id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return update_person(db, person, data)


@router.delete("/{person_id}", status_code=204)
def delete(person_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    person = get_person(db, person_id, current_user.id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    delete_person(db, person)
