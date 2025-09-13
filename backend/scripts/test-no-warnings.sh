#!/bin/bash
# Script to run tests with warnings disabled
# Usage: ./scripts/test-no-warnings.sh

set -e

echo "🧪 Running tests with warnings disabled..."

# Activate virtual environment
source .venv/bin/activate

# Run tests with warnings disabled
python -m pytest --disable-warnings --tb=short -q

echo "✅ All tests completed successfully!"
