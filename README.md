# Learning Hub - Production Ready Web Application

A comprehensive multi-role web application for connecting teachers and students in Sri Lanka's education system.

## 🚀 Features

- **Multi-Role Authentication**: Student, Teacher, and Admin roles
- **Class Discovery**: Students can browse approved teacher posts
- **Teacher Dashboard**: Create and manage class advertisements
- **Admin Panel**: Approve/reject teacher posts and manage users
- **Real-time Communication**: Comment system for student-teacher interaction
- **Responsive Design**: Mobile-first approach with modern UI
- **Production Ready**: Configured for Vercel + Render + MongoDB Atlas deployment

## 🛠️ Tech Stack

### Frontend
- **React.js** (v19.2.4) - Modern React with hooks
- **CSS Modules** - Scoped styling
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js + Express** - RESTful API
- **MongoDB + Mongoose** - Database and ODM
- **JWT Authentication** - Secure token-based auth
- **bcrypt** - Password hashing

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Cloud database

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Vercel account
- Render account

## 🚀 Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learning-hub
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Edit .env with backend URL
   npm start
   ```

## 🌐 Production Deployment

### 1. MongoDB Atlas Setup
1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Create database user with read/write permissions

### 2. Backend Deployment (Render)
1. Connect your GitHub repository to Render
2. Use `render.yaml` configuration
3. Set environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate a secure random string
   - `NODE_ENV`: production
   - `FRONTEND_URL`: Your Vercel app URL

### 3. Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel
2. Use `vercel.json` configuration
3. Set environment variable:
   - `REACT_APP_API_BASE_URL`: Your Render backend URL + /api

### 4. Environment Variables

#### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learning_hub
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

#### Frontend (.env)
```env
REACT_APP_API_BASE_URL=https://your-backend.onrender.com/api
```

## 📱 Features Overview

### Student Dashboard
- Browse approved class posts by subject
- Advanced search and filtering
- Contact teachers directly
- Responsive mobile experience

### Teacher Dashboard
- Create detailed class advertisements
- Manage post status (Draft → Pending → Approved)
- Track student interactions
- Professional post management interface

### Admin Panel
- Approve/reject teacher posts
- User management
- System oversight
- Bulk operations support

## 🔧 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Class Posts
- `GET /api/class-posts/my-posts` - Teacher's posts
- `POST /api/class-posts` - Create post
- `PUT /api/class-posts/:id` - Update post
- `DELETE /api/class-posts/:id` - Delete post
- `POST /api/class-posts/:id/submit` - Submit for approval
- `GET /api/class-posts/approved` - Public approved posts

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## 🎨 UI/UX Improvements

- **Loading States**: Spinners and skeleton screens
- **Error Handling**: User-friendly error messages
- **Empty States**: Helpful guidance when no data
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Role-based access control

## 📈 Performance Optimizations

- Code splitting and lazy loading
- Optimized bundle sizes
- Efficient database queries
- CDN-ready static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, please open an issue in the repository.

---

**Built with ❤️ for Sri Lankan education community**
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
