from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate


def get_tags(db: Session, user_id: int) -> List[Tag]:
    return db.query(Tag).filter(Tag.user_id == user_id).all()


def get_tag(db: Session, tag_id: int, user_id: int) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()


def create_tag(db: Session, data: TagCreate, user_id: int) -> Tag:
    tag = Tag(user_id=user_id, **data.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def update_tag(db: Session, tag: Tag, data: TagUpdate) -> Tag:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, tag: Tag):
    db.delete(tag)
    db.commit()
