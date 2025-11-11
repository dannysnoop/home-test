# 🚀 Backend API — Quick Start & Usage (with Docker)

## 🧰 Requirements
- Node.js ≥ 18
- MySQL ≥ 8
- Redis ≥ 6
- Docker & Docker Compose ≥ v2 (recommended)

---

## ⚙️ Setup (Local, no Docker)
```bash
npm install
cp .env.example .env
```
Edit `.env`:
```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=app
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
# --- SMTP (for password reset / notifications) ---
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM="App Name <no-reply@example.com>"
```
```

---

## 🐳 Setup (Docker Compose)
**1) Create `.env` in project root** (uses service names for hosts):
```env
PORT=8080
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=app
REDIS_URL=redis://redis:6379
# --- JWT ---
JWT_SECRET=supersecret
JWT_EXPIRES_IN=86400
JWT_RESET_SECRET=supersecret-reset
JWT_RESET_EXPIRES=15m
BASE_URL=http://localhost:8080
GEO_KEY=geo:users:latest


# --- SMTP (for password reset / notifications) ---
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM="App Name <no-reply@example.com>"
```

**2) Start environment**
```bash
docker compose up -d
```

**3) Verify health**
```bash
curl http://localhost:8080/v1/health
```

**4) DB migrations & seed (optional)**
```bash
docker compose exec api npx ts-node src/scripts/db-migrate.ts
docker compose exec api npx ts-node src/scripts/seed.ts
```

**5) Logs & maintenance**
```bash
docker compose logs -f api
docker compose restart api
docker compose down -v    # stops & removes volumes (resets DB)
```

---

## ▶️ Run Locally (without Docker)
```bash
npm run dev
# or (prod)
npm run build && npm start
```
App URL: **http://localhost:8080**

---

## 🔑 API Endpoints (Summary)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/v1/health` | Health check |
| POST | `/v1/auth/register` | Register user |
| POST | `/v1/auth/login` | Login (JWT) |
| POST | `/v1/users/me/location` | Update user location *(JWT)* |
| GET | `/v1/users/nearby` | Nearby users *(JWT)* |
| GET | `/v1/stores/search` | Search stores |
| POST | `/v1/users/me/favorites/:storeId` | Add favorite *(JWT)* |
| GET | `/v1/users/me/favorites` | List favorites *(JWT)* |
| DELETE | `/v1/users/me/favorites/:storeId` | Remove favorite *(JWT)* |

---

## 🧪 Quick Tests (cURL)
**Register**
```bash
curl -X POST http://localhost:8080/v1/auth/register   -H "Content-Type: application/json"   -d '{"username":"demo","email":"demo@example.com","password":"secret123"}'
```
**Login**
```bash
curl -X POST http://localhost:8080/v1/auth/login   -H "Content-Type: application/json"   -d '{"email":"demo@example.com","password":"secret123"}'
```
**Authorized request**
```bash
TOKEN=your_access_token
curl -X POST http://localhost:8080/v1/users/me/location   -H "Authorization: Bearer $TOKEN"   -H "Content-Type: application/json"   -d '{"lat":10.77,"lon":106.69}'
```

---

## 🧱 Stack
- Express + TypeORM (MySQL)
- Redis (Geo/Cache)
- JWT auth
- Socket.IO realtime
- Helmet, CORS, Rate-limit, Zod validation

---

## 🐳 Docker Artifacts
- `docker-compose.yml` — brings up MySQL, Redis, API
- `Dockerfile` — production image (multi-stage)
- `.env.example` — template env vars

> Tip: For production, build the image (`docker build -t api .`) and run with a separate Compose/stack using the built artifact (no bind mounts), ensure `NODE_ENV=production`, and disable TypeORM `synchronize` in favor of migrations.
