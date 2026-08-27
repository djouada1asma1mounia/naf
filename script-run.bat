@echo off
title START BACKEND + FRONTEND

REM dissier actuel 
cd /d "%~dp0"

echo Current folder:
cd

echo ====================
echo BACKEND
echo ====================

cd backend
call npx pm2 start dist/main.js --name backend 
call npx pm2 save

echo ====================
echo FRONTEND
echo ====================

cd ..
cd frontend

call npx pm2 start node --name frontend -- node_modules/serve/build/main.js -s build -l 3000
call npx pm2 save

echo ====================
echo FINISHED
echo ====================

exit


