from fastapi import APIRouter

from app.api.routes import (
    accounts,
    allocation_rules,
    categories,
    incomes,
    items,
    login,
    monthly_reports,
    private,
    sprints,
    todos,
    transactions,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(todos.router)
api_router.include_router(sprints.router)
api_router.include_router(accounts.router)
api_router.include_router(categories.router)
api_router.include_router(incomes.router)
api_router.include_router(transactions.router)
api_router.include_router(allocation_rules.router)
api_router.include_router(monthly_reports.router, prefix="/monthly-reports", tags=["monthly-reports"])


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
