from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models_student import Student, StudentCreate, StudentRead, StudentUpdate

router = APIRouter()

@router.get("/", response_model=list[StudentRead])
def list_students(session: Session = Depends(get_session)):
    return session.exec(select(Student)).all()

@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: int, session: Session = Depends(get_session)):
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("/", response_model=StudentRead, status_code=201)
def create_student(data: StudentCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Student).where(Student.student_number == data.student_number)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student number already registered")
    student = Student.model_validate(data)
    session.add(student)
    session.commit()
    session.refresh(student)
    return student

@router.patch("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, data: StudentUpdate, session: Session = Depends(get_session)):
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    session.add(student)
    session.commit()
    session.refresh(student)
    return student

@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: int, session: Session = Depends(get_session)):
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    session.delete(student)
    session.commit()