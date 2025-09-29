from datetime import date, datetime, timezone
from sqlmodel import Session, select, func

from app.core.db import engine
from app.crud.todo import rollover_overdue_todos


def batch_rollover_overdue_todos():
    """Background job to automatically rollover overdue todos for all users"""
    with Session(engine) as session:
        # Get all users with overdue todos
        from app.models import User, Todo
        
        users_with_overdue = session.exec(
            select(User.id)
            .join(Todo)
            .where(
                Todo.scheduled_date < date.today(),
                Todo.status.in_(["todo", "doing", "planning"])
            )
            .distinct()
        ).all()
        
        total_rolled = 0
        for user_id in users_with_overdue:
            rolled_todos = rollover_overdue_todos(
                session=session, 
                owner_id=user_id
            )
            total_rolled += len(rolled_todos)
        
        print(f"Rolled over {total_rolled} overdue todos for {len(users_with_overdue)} users")
        return total_rolled


def get_overdue_todos_summary():
    """Get summary of overdue todos for monitoring"""
    with Session(engine) as session:
        from app.models import Todo, User
        
        # Count overdue todos by user
        overdue_count_statement = (
            select(User.email, func.count(Todo.id))
            .join(Todo)
            .where(Todo.scheduled_date < date.today())
            .where(Todo.status.in_(["todo", "doing", "planning"]))
            .group_by(User.email)
        )
        
        result = session.exec(overdue_count_statement).all()
        return dict(result)


if __name__ == "__main__":
    # Manual rollover test
    print("Running manual todo rollover...")
    count = batch_rollover_overdue_todos()
    print(f"Completed rollover: {count} todos rolled over")
