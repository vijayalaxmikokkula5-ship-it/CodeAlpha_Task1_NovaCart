# NovaCart – Simple E-commerce Store

A full-stack e-commerce store developed for the **CodeAlpha Full Stack Development Internship – Task 1**.

## Features
- Product listing and search
- Category filtering
- Product details
- Shopping cart with quantity controls
- User registration and login
- Checkout and order processing
- Order history
- MongoDB database
- Responsive UI

## Tech Stack
- Frontend: React + Vite + CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT + bcryptjs

## Run Locally

### Backend
```bash
cd backend
npm install
```

Create `.env` from `.env.example` and add your MongoDB connection string and JWT secret.

Seed products:
```bash
npm run seed
```

Start backend:
```bash
npm run dev
```

### Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

If the backend is not on port 5000, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

## CodeAlpha
Task: Simple E-commerce Store  
Internship: Full Stack Development  
Developer: Vijaya Laxmi Kokkula
