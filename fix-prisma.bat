@echo off
echo Fixing Prisma Client...
echo.
echo Step 1: Removing old Prisma Client
rmdir /s /q node_modules\.prisma 2>nul
echo.
echo Step 2: Regenerating Prisma Client
call npx prisma generate
echo.
echo Step 3: Done! Please restart your dev server with 'npm run dev'
pause

