# ⚡ PrimeTrade — Task Management Dashboard

A full-stack web application featuring JWT authentication, a React dashboard with CRUD task management, and a Node.js/Express + MongoDB backend.

---

## 📁 Project Structure

```
primetrade/
├── backend/                  # Node.js + Express API
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js    # JWT auth middleware
│   ├── models/
│   │   ├── User.js           # User model with bcrypt hashing
│   │   └── Task.js           # Task model with indexes
│   ├── routes/
│   │   ├── auth.js           # /api/auth (register, login, me)
│   │   ├── users.js          # /api/users (profile CRUD, password)
│   │   └── tasks.js          # /api/tasks (full CRUD + search/filter/stats)
│   ├── server.js             # Express app entry point
│   └── .env.example
├── frontend/                 # React.js SPA
│   ├── src/
│   │   ├── context/AuthContext.jsx   # Global auth state
│   │   ├── hooks/useTasks.js         # Task API custom hook
│   │   ├── utils/api.js              # Axios instance + interceptors
│   │   ├── components/
│   │   │   ├── auth/ProtectedRoute.jsx
│   │   │   └── dashboard/
│   │   │       ├── Sidebar.jsx
│   │   │       └── TaskModal.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   └── styles.css
│   └── .env.example
└── PrimeTrade-API.postman_collection.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run dev      # starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start        # starts on http://localhost:3000
```

---

## ✅ Features Implemented

### Authentication
- JWT-based register/login/logout
- Password hashing with **bcryptjs** (salt rounds: 12)
- Token stored in localStorage, sent via `Authorization: Bearer` header
- Auto-logout on 401 response (token expired/invalid)
- Protected routes redirect unauthenticated users to `/login`

### Dashboard
- Real-time task stats (Total / To Do / In Progress / Done)
- Full task CRUD (Create, Read, Update, Delete)
- Search with 400ms debounce
- Filter by status and priority
- Sort by date, priority, title
- Paginated results (server-side)
- Tags support per task
- Delete confirmation modal

### Profile
- View & update name and bio
- Change password with current password verification
- Password strength indicator on register

### Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT secret stored in environment variables
- **Helmet.js** for HTTP security headers
- **Rate limiting** (100 req / 15 min per IP)
- Input validation with `express-validator` (server) + Yup (client)
- CORS restricted to frontend origin
- Request body size limited to 10KB
- All task queries scoped to authenticated user (prevents data leakage)

---

## 📖 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login & get token |
| GET | `/api/auth/me` | ✓ | Get current user |
| GET | `/api/users/profile` | ✓ | Get user profile |
| PUT | `/api/users/profile` | ✓ | Update name/bio |
| PUT | `/api/users/password` | ✓ | Change password |
| GET | `/api/tasks` | ✓ | List tasks (search, filter, paginate) |
| POST | `/api/tasks` | ✓ | Create task |
| GET | `/api/tasks/:id` | ✓ | Get single task |
| PUT | `/api/tasks/:id` | ✓ | Update task |
| DELETE | `/api/tasks/:id` | ✓ | Delete task |
| GET | `/api/tasks/stats/summary` | ✓ | Dashboard stats |

> Import `PrimeTrade-API.postman_collection.json` into Postman to test all endpoints. The Login/Register requests auto-save the token to a collection variable.

---

## 📈 Scaling Notes: Frontend-Backend Integration for Production

### 1. Authentication & Token Management
- **Short-lived JWTs** (15 min access token) + **refresh tokens** stored in `httpOnly` cookies to prevent XSS theft
- Implement a token refresh interceptor in Axios that silently renews the access token using the refresh token
- Use **Redis** to maintain a token blacklist for instant logout across sessions

### 2. API Layer
- Move from a single Express monolith to **microservices** (auth service, task service, notification service) behind an **API Gateway** (e.g., NGINX, Kong, AWS API Gateway)
- Add **OpenAPI/Swagger** documentation generated from route schemas
- Implement **API versioning** (`/api/v1/...`) to support backward-compatible upgrades

### 3. Frontend Performance
- **Code splitting** with `React.lazy` + `Suspense` — each page loads its own bundle
- **React Query** (or SWR) to replace manual `useState` data fetching — handles caching, background refetching, and optimistic updates
- Serve the React build via **CDN** (Cloudfront, Vercel) with aggressive cache headers; only API calls hit the server
- **Service Worker** (PWA) for offline task viewing

### 4. Database
- MongoDB **Atlas** with replica sets for high availability
- Add **indexes** on hot query paths (already done for `user + status`, `user + priority`)
- For very large datasets: **cursor-based pagination** instead of offset pagination
- **Database connection pooling** via Mongoose `poolSize` config

### 5. Security Hardening
- Add **CSRF protection** for cookie-based sessions
- Implement **brute-force protection** on `/auth/login` (e.g., account lockout after N failures with exponential backoff)
- Store secrets in a **vault** (AWS Secrets Manager, HashiCorp Vault) — never in `.env` files on production
- Add **audit logging** for sensitive operations (password changes, account deletion)

### 6. Infrastructure & DevOps
- **Docker** + Docker Compose for local dev parity; **Kubernetes** for production orchestration
- CI/CD pipeline (GitHub Actions) that runs tests, builds Docker image, and deploys on merge to `main`
- **Horizontal scaling** of the Express API behind a load balancer — stateless design (JWT) makes this trivial
- **Monitoring**: Datadog or Prometheus + Grafana for API latency/error rate dashboards
- **Error tracking**: Sentry for both frontend and backend

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, React Hook Form, Yup |
| Styling | Custom CSS (design system variables) |
| HTTP Client | Axios with request/response interceptors |
| Backend | Node.js, Express 4 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Database | MongoDB, Mongoose |
| Validation | express-validator (server), Yup (client) |
| Security | Helmet, express-rate-limit, CORS |

---

*Built for PrimeTrade Frontend Developer Intern Assignment*
