#!/bin/bash
# setup.sh — one-shot install for both backend and frontend

echo "🚀 Setting up AI Video Generator..."

# Backend
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend/.env — add your GEMINI_API_KEY"
fi
cd ..

# Frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
