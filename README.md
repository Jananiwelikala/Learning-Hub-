# Learning Hub

Learning Hub is a full-stack A/L learning platform built for Sri Lankan students, teachers, and administrators. It brings together stream-based learning content, class discovery, past paper practice, teacher class post approvals, and an AI study chat in one role-based web application.

## Project Status

Completed final-year individual project.

The application includes:

- Student dashboard
- Teacher dashboard
- Admin panel
- Role-based authentication and access control
- Real MongoDB-backed learning content management
- AI study assistant with lesson-material awareness
- Class post approval workflow
- Stream, subject, lesson, note, video, and past paper management

## Tech Stack

Frontend:

- React
- React Scripts
- CSS / CSS Modules

Backend:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Gemini API integration for AI assistance

Database:

- MongoDB / MongoDB Atlas

## Main Features

### Student

- Register and login as a student
- Select A/L stream and exam year
- Dashboard customized by student stream and A/L year
- A/L countdown based on August of the selected exam year
- View stream subjects and lessons
- Access lesson videos, notes, MCQs, structured questions, and past papers
- Browse approved teacher class posts
- Use AI study chat for lesson-related and general study questions
- Update profile details and selected stream

### Teacher

- Register and login as a teacher
- Select title: Mr., Mrs., or Miss
- View and edit teacher account/profile details
- Create class posts
- Submit class posts for admin approval
- See approval status after admin review

### Admin

- Manage students, teachers, and admins
- Manage real streams, subjects, lessons, lesson videos, notes, past papers, and questions
- Add new streams that appear in student registration and profile dropdowns
- Review teacher class posts
- Approve, reject, or delete class posts
- View dashboard counts and system content

## Folder Structure

```text
Learning Hub/
  Backend/
    controllers/
    Middleware/
    models/
    routes/
    utils/
    server.js
    package.json

  frontend/
    public/
    src/
    package.json

  README.md
```

## Environment Variables

Create environment files from the examples before running the project.

### Backend `.env`

```env
MONGO_URI=mongodb://localhost:27017/learning_hub
JWT_SECRET=replace_with_a_secure_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=optional_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` is optional. Without it, AI features that require external generation may return fallback responses.

### Frontend `.env`

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Run Locally

### 1. Backend

```bash
cd Backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

## Useful Scripts

Backend:

```bash
npm start
npm run dev
npm run seed:biology-unit2-clean
npm run ingest:biology-notes
npm run cleanup:legacy-lessons
```

Frontend:

```bash
npm start
npm run build
npm test
```

## Core API Areas

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`

Student:

- `GET /api/student/dashboard`
- `GET /api/student/subjects`
- `GET /api/student/lessons/:subjectId`
- `GET /api/student/lesson/:lessonId`
- `POST /api/student/chatbot/message`

Teacher class posts:

- `GET /api/class-posts/my-posts`
- `POST /api/class-posts`
- `PUT /api/class-posts/:id`
- `POST /api/class-posts/:id/submit`

Admin:

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/streams`
- `GET /api/admin/subjects`
- `GET /api/admin/lessons`
- `GET /api/admin/class-posts`

Public:

- `GET /api/streams`
- `GET /api/subjects`
- `GET /api/class-posts/approved`

## Role-Based Access

The backend uses JWT authentication and role middleware.

- Student-only routes are protected with the `student` role.
- Teacher-only routes are protected with the `teacher` role.
- Admin-only routes are protected with the `admin` role.
- The auth middleware verifies the current user from MongoDB before authorizing protected requests.

## Notes

- Streams and subjects are stored in MongoDB and managed from the admin panel.
- Student registration and profile stream dropdowns use the real stream records from the backend.
- Teacher class posts only become visible to students after admin approval.
- Student dashboard exam countdown uses August 1 of the selected A/L year.

## Author

Learning Hub A/L Platform  
Final-year individual project
