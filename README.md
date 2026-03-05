# Learning Hub

Learning Hub is a full-stack web platform for A/L learning support with stream/subject organization, lesson access, and initial assessment workflows.

## Tech Stack

- Frontend: React
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Authentication: JWT + bcrypt

## Implemented Modules

### 1. User Authentication and Authorization

- User registration with bcrypt password hashing
- Secure login with JWT token generation
- Token verification middleware for protected APIs
- Role-based access control (Admin / Teacher / Student)
- Role-restricted endpoints

### 2. Stream and Subject Management

- Admin CRUD for Streams
- Admin CRUD for Subjects
- Public listing endpoints for Streams and Subjects
- Subject filtering by `streamId`

### 3. Lesson Management

- Lessons linked to Subjects
- Lesson metadata support:
  - Title
  - Description
  - Video URL
  - Downloadable notes URL
- Public lesson preview endpoint (limited fields)
- Full lesson access restricted to authenticated users

### 4. Past Paper and Assessment (Initial Phase)

- 2024 A/L sample question integration
- Question type support: MCQ / Structured / Essay
- Automatic MCQ evaluation backend logic
- Student attempt and score persistence
- Structured/essay submission framework with AI-ready feedback fields

## Key API Groups

- `/api/register`, `/api/login`, `/api/me`
- `/api/streams`, `/api/subjects`
- `/api/lessons`
- `/api/mcqs`
- `/api/assessments`

## Run Locally

### Backend

1. Go to `Backend`
2. Install dependencies:
   - `npm install`
3. Configure `.env` with:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `PORT` (optional)
4. Start server:
   - `npm run dev`

### Frontend

1. Go to `frontend`
2. Install dependencies:
   - `npm install`
3. Configure `.env`:
   - `REACT_APP_API_BASE_URL=http://localhost:5000`
4. Start frontend:
   - `npm start`

## Notes

- Sample data seeding runs when backend starts.
- Admin-only operations are protected using JWT + role middleware.
