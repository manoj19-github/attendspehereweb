<img width="1536" height="1024" alt="system_design_AttendSpehere (1)" src="https://github.com/user-attachments/assets/19109520-2d6f-4303-99a2-070f525aa051" />
🚀 Employee Tracking & Attendance System (Backend)

A high-performance backend system for real-time employee tracking and attendance management, built with a focus on accuracy, scalability, and real-world edge case handling.

📌 Overview

This backend powers a workforce tracking system where:

Employees check in/out using a mobile app
Their location is tracked in real-time
Attendance is automatically managed using geofencing
Admins can monitor employees live from a web dashboard

The system is optimized using Redis caching, rate limiting, and smart database writes.

🏗️ Architecture
Mobile App (React Native)
        ↓ (30s ping API)
Backend (Node.js + Express)
        ↓
Redis (Live State + Rate Limit + Pub/Sub)
        ↓
PostgreSQL (Persistent Storage)
        ↓
Socket.IO → Admin Panel (Real-time tracking)
⚙️ Tech Stack
Backend
Node.js
Express.js
TypeScript
Database
PostgreSQL
Sequelize ORM
Caching & Performance
Redis (in-memory store)
Location state
Rate limiting
Pub/Sub messaging
Real-Time
Socket.IO
Redis Pub/Sub
Security
JWT Authentication
Device Binding (one user → one device)
📍 Core Features
✅ Attendance Management
Manual check-in / check-out
Automatic check-in when entering office
Automatic check-out when leaving office
Supports multiple check-in/check-out per day
📡 Live Location Tracking
Location ping every 30 seconds
Stored in Redis (not DB) for performance
Every 15 minutes → DB entry created
📏 Smart Location Logging

Database entry created when:

User crosses office boundary (100m)
Distance thresholds crossed (500m, 1500m)
Time interval reached (15 min)
🧠 Geofencing Logic
Office defined by latitude, longitude, radius
Uses Haversine formula for accurate distance calculation
⚡ Rate Limiting
Redis-based rate limiter
Prevents excessive API hits
Ensures backend stability under heavy load
📡 Real-Time Tracking (Admin Panel)
Every 10 seconds, location updates are broadcast
Uses Redis Pub/Sub + Socket.IO
Admin can see live employee movement
📶 Offline Support
Mobile app stores location data in AsyncStorage
Queue system maintains unsent data
On reconnect → user triggers sync → backend processes all data
🔁 Location Tracking Algorithm
Tracking works only during working hours
Office radius (e.g., 100m) defines "inside office"
First manual check-in → DB entry created
Every 30s → location ping stored in Redis
Every 15 min → location saved in DB
Distance-based triggers → DB entry (100m, 500m, 1500m)
Auto check-in / check-out based on boundary crossing
Multiple attendance sessions supported per day
Working hours calculated from check-in → check-out
Every 10s → real-time update sent to admin panel
🗄️ Database Design
Tables:
users – Employee details
attendance – Check-in / check-out events
locations – Location logs
devices – Device binding (security)
office_settings – Office geofence config
🔐 Security Features
JWT-based authentication
Device binding (prevents login from multiple devices)
Rate limiting (prevents API abuse)
Controlled attendance flow (checkin → checkout sequence)
🚀 API Endpoints (Sample)
POST   /auth/login
POST   /attendance/checkin
POST   /attendance/checkout
POST   /location/ping
GET    /location/history
GET    /attendance/report
⚡ Performance Optimizations
Redis caching for live state
Reduced DB writes using interval batching
Distance-based filtering
Pub/Sub for real-time updates
Efficient pagination & indexing
🛠️ Setup Instructions
1. Clone the repo
git clone https://github.com/your-repo/backend.git
cd backend
2. Install dependencies
npm install
3. Setup environment variables

Create .env file:

PORT=5000

DB_HOST=localhost
DB_NAME=your_db
DB_USER=postgres
DB_PASS=password

JWT_SECRET=your_secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
4. Run project
npm run dev
📊 Key Highlights
Real-time tracking with minimal DB load
Handles high-frequency location updates efficiently
Supports offline-first mobile behavior
Production-ready rate limiting
Clean and scalable monolithic architecture
👨‍💻 Author

Manoj Santra

MERN Stack & React Native Developer
Focused on scalable backend systems and real-time applications
