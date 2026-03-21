# URL Shortener

A full-stack URL shortening service built with Node.js, Express, PostgreSQL, and React. Features user authentication, URL shortening, and click tracking.

## 🚀 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **URL Shortening**: Convert long URLs into short, shareable links
- **Click Tracking**: Monitor how many times each shortened URL has been accessed
- **RESTful API**: Well-documented endpoints for all operations
- **Database**: PostgreSQL with proper schema and relationships

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **pg** - PostgreSQL client

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **SCSS** - Styling
- **React Icons** - Icon library
- **Vite** - Build tool

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### URL Management Endpoints

- `POST /api/urls/shorten` - Create shortened URL (requires auth)
- `GET /api/urls` - Get user's URLs (requires auth)
- `GET /:shortCode` - Redirect to original URL