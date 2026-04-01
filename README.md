# FitLog — Gym Progress Tracker 💪

A full-stack fitness tracking app with AI-powered insights.

**Tech Stack:** FastAPI (Python) + React (TypeScript) + PostgreSQL + Google Gemini AI

## Quick Start

### 1. Start PostgreSQL (Docker)
```bash
docker compose up -d
```

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** and start tracking! 🏋️

## Features

- **Workout Plans** — Create multiple plans with day splits (push/pull/legs, etc.)
- **Exercises** — Track name, sets, reps, weight/level per exercise
- **Session Logging** — Log actual workout performance against your plan
- **Weight Tracking** — Record body weight with date stamps and graphs
- **Progress Charts** — Weight trend, training volume, consistency analytics
- **Gym Day Scheduler** — Mark which days you normally go to the gym
- **AI Insights** — Get AI-powered recommendations (needs Gemini API key)

## Environment Variables (`backend/.env`)
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/fitlog_db
GEMINI_API_KEY=your_key_here  # Optional, for AI features
```
