from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, Category, CategoryCreate, CategoryGroup

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)
    
    # Tạo dữ liệu mẫu cho categories (cho user hiện tại)
    create_sample_categories(session, user.id)


def create_sample_categories(session: Session, user_id: str) -> None:
    """Tạo dữ liệu mẫu cho categories"""
    
    # Kiểm tra xem đã có categories chưa
    existing_categories = session.exec(select(Category).where(Category.user_id == user_id)).first()
    if existing_categories:
        return  # Đã có categories, không tạo thêm
        
    # Dữ liệu mẫu cho categories
    sample_categories = [
        # Needs (Nhu cầu thiết yếu)
        {"name": "Nhà ở", "grp": CategoryGroup.needs, "is_envelope": True},
        {"name": "Ăn uống", "grp": CategoryGroup.needs, "is_envelope": True},
        {"name": "Đi lại", "grp": CategoryGroup.needs, "is_envelope": True},
        {"name": "Y tế", "grp": CategoryGroup.needs, "is_envelope": True},
        {"name": "Bảo hiểm", "grp": CategoryGroup.needs, "is_envelope": True},
        {"name": "Tiện ích", "grp": CategoryGroup.needs, "is_envelope": True},
        
        # Wants (Muốn có)
        {"name": "Giải trí", "grp": CategoryGroup.wants, "is_envelope": True},
        {"name": "Mua sắm", "grp": CategoryGroup.wants, "is_envelope": True},
        {"name": "Du lịch", "grp": CategoryGroup.wants, "is_envelope": True},
        {"name": "Thể thao", "grp": CategoryGroup.wants, "is_envelope": True},
        {"name": "Học tập", "grp": CategoryGroup.wants, "is_envelope": True},
        {"name": "Quà tặng", "grp": CategoryGroup.wants, "is_envelope": True},
        
        # Savings & Debt (Tiết kiệm & Nợ)
        {"name": "Quỹ khẩn cấp", "grp": CategoryGroup.savings_debt, "is_envelope": True},
        {"name": "Tiết kiệm dài hạn", "grp": CategoryGroup.savings_debt, "is_envelope": True},
        {"name": "Đầu tư", "grp": CategoryGroup.savings_debt, "is_envelope": True},
        {"name": "Trả nợ vay", "grp": CategoryGroup.savings_debt, "is_envelope": True},
        {"name": "Trả nợ thẻ tín dụng", "grp": CategoryGroup.savings_debt, "is_envelope": True},
        
        # Income
        {"name": "Thu nhập", "grp": CategoryGroup.income, "is_envelope": True},
        {"name": "Quà tặng", "grp": CategoryGroup.income, "is_envelope": True},
        {"name": "Chuyền trả", "grp": CategoryGroup.income, "is_envelope": True},
    ]
    
    # Tạo categories
    for cat_data in sample_categories:
        category = Category(
            name=cat_data["name"],
            grp=cat_data["grp"],
            is_envelope=cat_data["is_envelope"],
            user_id=user_id
        )
        session.add(category)
    
    session.commit()
