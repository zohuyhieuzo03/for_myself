#! /usr/bin/env bash

set -e
set -x

# Backup file options.ts nếu tồn tại
if [ -f "frontend/src/client/options.ts" ]; then
  echo "Backing up options.ts..."
  cp frontend/src/client/options.ts options.ts.backup
fi

cd backend
source .venv/bin/activate
python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../openapi.json
cd ..
mv openapi.json frontend/
cd frontend
npm run generate-client

# Restore file options.ts nếu có backup
if [ -f "../options.ts.backup" ]; then
  echo "Restoring options.ts..."
  mv ../options.ts.backup src/client/options.ts
fi