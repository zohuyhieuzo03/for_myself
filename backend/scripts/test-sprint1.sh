#!/bin/bash

# Test script for Sprint 1 models and APIs
# This script runs all tests for the Sprint 1 implementation

echo "🚀 Running Sprint 1 Tests..."
echo "================================"

# Change to backend directory
cd /Users/huyhieu/full-stack-fastapi-template/backend

echo "📋 Running CRUD Tests..."
echo "------------------------"
python -m pytest app/tests/crud/test_sprint.py -v
python -m pytest app/tests/crud/test_account.py -v
python -m pytest app/tests/crud/test_category.py -v
python -m pytest app/tests/crud/test_income.py -v
python -m pytest app/tests/crud/test_transaction.py -v
python -m pytest app/tests/crud/test_allocation_rule.py -v

echo ""
echo "🌐 Running API Tests..."
echo "----------------------"
python -m pytest app/tests/api/routes/test_sprints.py -v

echo ""
echo "🔄 Running Integration Tests..."
echo "-------------------------------"
python -m pytest app/tests/integration/test_sprint1_workflow.py -v

echo ""
echo "✅ All Sprint 1 Tests Completed!"
echo "================================"
