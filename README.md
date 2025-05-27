# StudyFlow

StudyFlow is a full-stack productivity and study management application. It features habit tracking, kanban boards, planners, and more, built with a modern React frontend and a Node.js/Express backend.

## Features
- Habit Tracker
- Kanban Board
- Planner
- Authentication
- Responsive UI (Material-UI)
- RESTful API (Express, Prisma, PostgreSQL)

---

## Project Structure
```
StudyFlow/
  client/   # React + Vite frontend
  server/   # Node.js + Express backend
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- PostgreSQL (for backend)

---

## 1. Clone the Repository
```sh
git clone https://github.com/Raghaverma/StudyFlow.git
cd StudyFlow
```

---

## 2. Environment Variables

### Frontend (`client/.env.local`)
Create a `.env.local` file in the `client` directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend (`server/.env`)
Create a `.env` file in the `server` directory:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your_jwt_secret
```

---

## 3. Install Dependencies

### Frontend
```sh
cd client
npm install
```

### Backend
```sh
cd ../server
npm install
```

---

## 4. Database Setup (Backend)

- Initialize Prisma and apply migrations:
```sh
npx prisma migrate dev
```

---

## 5. Running the App

### Frontend (React + Vite)
```sh
cd client
npm run dev
```

### Backend (Express API)
```sh
cd server
node src/server.js
```

---

## 6. Usage
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## Tech Stack
- **Frontend:** React, Vite, Material-UI, Zustand, Axios, React Router
- **Backend:** Node.js, Express, Prisma, PostgreSQL, JWT, bcryptjs

---

## License
This project is licensed under the MIT License.
