from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.person import Person
from app.schemas.person import PersonCreate, PersonUpdate


def get_persons(db: Session, user_id: int) -> List[Person]:
    return db.query(Person).filter(Person.user_id == user_id).all()


def get_person(db: Session, person_id: int, user_id: int) -> Optional[Person]:
    return db.query(Person).filter(
        Person.id == person_id, Person.user_id == user_id
    ).first()


def create_person(db: Session, data: PersonCreate, user_id: int) -> Person:
    person = Person(user_id=user_id, **data.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


def update_person(db: Session, person: Person, data: PersonUpdate) -> Person:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(person, field, value)
    db.commit()
    db.refresh(person)
    return person


def delete_person(db: Session, person: Person):
    db.delete(person)
    db.commit()
