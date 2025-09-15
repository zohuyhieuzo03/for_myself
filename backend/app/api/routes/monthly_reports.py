import uuid
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_

from app import crud
from app.api.deps import get_current_user, get_db
from app.models import (
    MonthlyFinancialReport, 
    MonthlyFinancialSummary, 
    MonthlyFinancialReports,
    Income, 
    Transaction, 
    AllocationRule,
    IncomePublic,
    TransactionPublic,
    AllocationRulePublic,
    User,
    TxnType
)

router = APIRouter()


@router.get("/summary/{year}/{month}", response_model=MonthlyFinancialSummary)
def get_monthly_financial_summary(
    *,
    db: Session = Depends(get_db),
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get monthly financial summary for a specific year and month.
    """
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    # Calculate date range for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    # Get incomes for the month
    income_statement = (
        select(Income)
        .where(Income.user_id == current_user.id)
        .where(Income.received_at >= start_date)
        .where(Income.received_at < end_date)
    )
    incomes = db.exec(income_statement).all()
    
    # Get transactions for the month
    transaction_statement = (
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .where(Transaction.txn_date >= start_date)
        .where(Transaction.txn_date < end_date)
    )
    transactions = db.exec(transaction_statement).all()
    
    # Calculate totals
    total_income = sum(income.net_amount for income in incomes)
    total_expenses = sum(txn.amount for txn in transactions if txn.type == TxnType.expense)
    net_amount = total_income - total_expenses
    
    # Calculate category breakdown
    category_breakdown = {}
    for txn in transactions:
        if txn.category:
            category_name = txn.category.name
            if category_name not in category_breakdown:
                category_breakdown[category_name] = 0.0
            if txn.type == TxnType.expense:
                category_breakdown[category_name] += txn.amount
            else:
                category_breakdown[category_name] -= txn.amount
    
    # Calculate account breakdown
    account_breakdown = {}
    for txn in transactions:
        account_name = txn.account.name
        if account_name not in account_breakdown:
            account_breakdown[account_name] = 0.0
        if txn.type == TxnType.expense:
            account_breakdown[account_name] -= txn.amount
        else:
            account_breakdown[account_name] += txn.amount
    
    return MonthlyFinancialSummary(
        year=year,
        month=month,
        total_income=total_income,
        total_expenses=total_expenses,
        net_amount=net_amount,
        income_count=len(incomes),
        expense_count=len([t for t in transactions if t.type == TxnType.expense]),
        category_breakdown=category_breakdown,
        account_breakdown=account_breakdown
    )


@router.get("/detailed/{year}/{month}", response_model=MonthlyFinancialReport)
def get_monthly_financial_report(
    *,
    db: Session = Depends(get_db),
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get detailed monthly financial report for a specific year and month.
    """
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    # Calculate date range for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    # Get incomes for the month
    income_statement = (
        select(Income)
        .where(Income.user_id == current_user.id)
        .where(Income.received_at >= start_date)
        .where(Income.received_at < end_date)
    )
    incomes = db.exec(income_statement).all()
    
    # Get transactions for the month
    transaction_statement = (
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .where(Transaction.txn_date >= start_date)
        .where(Transaction.txn_date < end_date)
    )
    transactions = db.exec(transaction_statement).all()
    
    # Get allocation rules (global ones, not sprint-specific)
    allocation_statement = (
        select(AllocationRule)
        .where(AllocationRule.user_id == current_user.id)
        .where(AllocationRule.sprint_id.is_(None))
    )
    allocation_rules = db.exec(allocation_statement).all()
    
    # Calculate totals
    total_income = sum(income.net_amount for income in incomes)
    total_expenses = sum(txn.amount for txn in transactions if txn.type == TxnType.expense)
    net_amount = total_income - total_expenses
    
    return MonthlyFinancialReport(
        year=year,
        month=month,
        total_income=total_income,
        total_expenses=total_expenses,
        net_amount=net_amount,
        income_count=len(incomes),
        expense_count=len([t for t in transactions if t.type == TxnType.expense]),
        incomes=[IncomePublic.model_validate(income) for income in incomes],
        transactions=[TransactionPublic.model_validate(txn) for txn in transactions],
        allocation_rules=[AllocationRulePublic.model_validate(rule) for rule in allocation_rules]
    )


@router.get("/range", response_model=MonthlyFinancialReports)
def get_monthly_financial_reports_range(
    *,
    db: Session = Depends(get_db),
    start_year: int = Query(..., description="Start year"),
    start_month: int = Query(..., description="Start month (1-12)"),
    end_year: int = Query(..., description="End year"),
    end_month: int = Query(..., description="End month (1-12)"),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get monthly financial reports for a range of months.
    """
    # Validate months
    if start_month < 1 or start_month > 12 or end_month < 1 or end_month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    if start_year > end_year or (start_year == end_year and start_month > end_month):
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    reports = []
    current_year = start_year
    current_month = start_month
    
    while current_year < end_year or (current_year == end_year and current_month <= end_month):
        # Calculate date range for the current month
        start_date = date(current_year, current_month, 1)
        if current_month == 12:
            end_date = date(current_year + 1, 1, 1)
        else:
            end_date = date(current_year, current_month + 1, 1)
        
        # Get incomes for the month
        income_statement = (
            select(Income)
            .where(Income.user_id == current_user.id)
            .where(Income.received_at >= start_date)
            .where(Income.received_at < end_date)
        )
        incomes = db.exec(income_statement).all()
        
        # Get transactions for the month
        transaction_statement = (
            select(Transaction)
            .where(Transaction.user_id == current_user.id)
            .where(Transaction.txn_date >= start_date)
            .where(Transaction.txn_date < end_date)
        )
        transactions = db.exec(transaction_statement).all()
        
        # Calculate totals
        total_income = sum(income.net_amount for income in incomes)
        total_expenses = sum(txn.amount for txn in transactions if txn.type == TxnType.expense)
        net_amount = total_income - total_expenses
        
        reports.append(MonthlyFinancialReport(
            year=current_year,
            month=current_month,
            total_income=total_income,
            total_expenses=total_expenses,
            net_amount=net_amount,
            income_count=len(incomes),
            expense_count=len([t for t in transactions if t.type == TxnType.expense]),
            incomes=[IncomePublic.model_validate(income) for income in incomes],
            transactions=[TransactionPublic.model_validate(txn) for txn in transactions],
            allocation_rules=[]
        ))
        
        # Move to next month
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
    
    return MonthlyFinancialReports(data=reports, count=len(reports))
