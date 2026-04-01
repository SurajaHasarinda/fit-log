<div align="center">
  <img src="frontend/public/fit-log.svg" alt="FitLog Logo" width="120" />
</div>

# FitLog — AI-Powered Gym Progress Tracker

A professional, full-stack fitness tracking application featuring AI-driven workout analysis and muscle group coverage recommendations.

## 🚀 Quick Start (TL;DR)

```bash
# Start the entire stack with Docker
docker compose up -d

# Access at: http://localhost:9281
```

> 📦 **Docker Hub**: [`surajadev/fit-log`](https://hub.docker.com/r/surajadev/fit-log)

## ✨ Features

- **🏋️ Workout Plans** — Create and manage complex plans with automated day splits (Push/Pull/Legs, etc.).
- **📊 Progress Analytics** — Visual charts for body weight trends, training volume, and consistency.
- **🤖 AI Insights** — Advanced analysis of your plans using Google Gemini to identify missing muscle groups and suggest improvements.
- **📝 Performance Logging** — Detailed tracking of sets, reps, and weights with automated PR tracking.
- **📅 Gym Scheduler** — Visual calendar marking to keep you on track with your weekly routine.

## 🏗️ Architecture

### 🐍 Backend (FastAPI + Python)
- **Framework**: FastAPI ⚡
- **Database**: PostgreSQL 💾
- **ORM**: SQLAlchemy 2.0 (Async) ⛓️
- **AI**: Google Gemini Pro 🤖

### ⚛️ Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript 💙
- **Build Tool**: Vite ⚡
- **Styling**: Vanilla CSS (Premium Aesthetic) 🎨
- **Icons**: Lucide React 🎯

## 🚀 Quick Start

### 📋 Prerequisites
- 🐍 Python 3.11+
- 📦 Node.js 20+
- 🐳 Docker & Docker Compose

### 🔧 Backend Setup

1️⃣ Create and activate virtual environment:
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2️⃣ Install dependencies:
```bash
pip install -r requirements.txt
```

3️⃣ Configure environment:
```bash
# Create .env and set your Gemini API Key
echo "GEMINI_API_KEY=your_key_here" > .env
```

4️⃣ Run the backend:
```bash
uvicorn main:app --reload --port 9281
```

### 🎨 Frontend Setup

1️⃣ Navigate to frontend folder:
```bash
cd frontend
npm install
npm run dev
```

✅ Frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
fit-log/
├── 🐍 backend/             # FastAPI application
│   ├── 🛣️ controllers/     # API route handlers
│   ├── 💾 models/          # SQLAlchemy async models
│   ├── 📋 schemas/         # Pydantic validation models
│   └── 🔧 services/        # AI logic & Database services
├── ⚛️ frontend/            # React application
│   └── src/
│       ├── 🧩 components/  # Reusable UI components
│       ├── 📄 pages/       # Application views
│       ├── 🌐 api.ts       # Axios client setup
│       └── 📝 types.ts     # TypeScript definitions
├── 📦 k8s/                 # Kubernetes manifests for K3s
├── 🐳 Dockerfile           # Multi-stage production build
└── 📖 README.md           # This file
```

## 💻 Deployment (K3s)

This project is configured for automated deployment to a **K3s** cluster via GitHub Actions.

1. **GitHub Runner**: Connects via **Tailscale** to your private cluster.
2. **Registry**: Pushes to `surajadev/fit-log:latest`.
3. **Manifests**: Applied to the `fit-log` namespace with **NodePort 30006**.

## 📄 License

MIT License - see LICENSE file for details
