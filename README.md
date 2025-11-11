# 🚀 Backend API — Quick Start & Usage (with Docker)

## 🧰 Requirements
- Node.js ≥ 18
- MySQL ≥ 8
- Redis ≥ 6
- Docker & Docker Compose ≥ v2 (recommended)

---
---

## 🐳 Setup (Docker Compose)
**1) Create `.env` in project root** (uses service names for hosts):
```env
NODE_ENV=development
PORT=8080

DB_HOST=db
DB_PORT=3306
DB_USER=db_admin
DB_PASSWORD='Adm!n#9876'
DB_NAME=app_data
JWT_SECRET=super_secret_key_change_me
JWT_EXPIRES_IN=86400

JWT_RESET_EXPIRES=900
JWT_RESET_SECRET=super_secret_key_change_me1

BASE_URL='http://nodejs:8080'


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
 docker compose exec nodejs npx ts-node src/scripts/seed.ts```

**5) Logs & maintenance**
```bash
docker compose logs -f nodejs
docker compose restart nodejs
docker compose down -v    # stops & removes volumes (resets DB)
```



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
curl -X POST http://localhost:8080/v1/auth/login   -H "Content-Type: application/json"   -d '{"usernameOrEmail":"demo@example.com","password":"secret123"}'
```
**Authorized request**
```bash
TOKEN=your_access_token
curl -X POST http://localhost:8080/v1/users/me/location   -H "Authorization: Bearer $TOKEN"   -H "Content-Type: application/json"   -d '{"lat":10.77,"lon":106.69}'
```
**Search stores (authorized)**
```bash
TOKEN=your_access_token
curl --location 'http://localhost:8080/v1/stores/search?lat=13.7367&lon=100.5232&radiusKm=6' \
  --header "Authorization: Bearer $TOKEN"

```
**Add Favorite Store (authorized)**
```bash
TOKEN=your_access_token
curl --location --request POST 'http://localhost:8080/v1/users/me/favorites/7584f80c-a794-4f31-be9a-debe0598de92' \
  --header "Idempotency-Key: <unique_key>" \
  --header "Authorization: Bearer $TOKEN" \
  --data ''
```



**List Favorite Stores (authorized)**
```bash
TOKEN=your_access_token
curl --location 'http://localhost:8080/v1/users/me/favorites' \
  --header "Authorization: Bearer $TOKEN"
  
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
