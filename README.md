# 🛒 SALA Express — Product Management Backend API

A production-ready RESTful API backend for a **Product Management & POS Dashboard** system. Built with Node.js and Express, it powers a React admin panel with full CRUD, Cloudinary image storage, ABA Payway KHQR payment processing, product expiry alerts via Telegram, and `.docx` invoice generation.

---

## ✨ Features

- 🔐 **JWT Authentication** — Register/Login with bcrypt password hashing
- 📦 **Product Management** — CRUD with search, pagination, and category linking
- 🖼️ **Image Upload** — Multi-image upload via Cloudinary (JPEG/PNG/JPG)
- 🏷️ **Category Management** — Full CRUD
- 👤 **Customer Management** — Full CRUD
- 🛍️ **Order System** — Auto-generated invoice numbers, multi-item orders
- 💳 **ABA Payway Integration** — KHQR/ABA Pay via HMAC-SHA512 signed requests
- ⏰ **Product Expiry Tracking** — Batch-level expiry with Telegram alerts
- 🤖 **Telegram Bot Notifications** — Manual trigger + daily cron at 07:00 AM (ICT)
- 📄 **Invoice Generation** — Download `.docx` order invoices using a DOCX template
- 📊 **Request Logging** — IP, browser, OS, and device tracking on every request

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express.js v5 |
| Database | PostgreSQL (Render cloud) |
| ORM | Sequelize v6 + Sequelize CLI |
| Auth | JWT + bcryptjs |
| Image Storage | Cloudinary + multer |
| Payment | ABA Payway (Sandbox) |
| Notifications | Telegram Bot API |
| Scheduler | node-cron |
| Document Gen | docxtemplater + pizzip |
| HTTP Client | axios |
| Dev | nodemon |

---

## 📁 Folder Structure

```
BackEnd/
├── App.js                          # Entry point
├── .env                            # Environment variables (do not commit)
├── requestLogger.js                # Request logging middleware
│
├── config/
│   └── config.js                   # Sequelize database config (dev/prod)
│
├── models/                         # Sequelize models
│   ├── index.js
│   ├── user.js
│   ├── category.js
│   ├── products.js
│   ├── productImage.js
│   ├── productexpires.js
│   ├── customer.js
│   ├── order.js
│   ├── orderdetail.js
│   └── payment.js
│
├── migrations/                     # Database migration files
├── seeders/                        # (Empty) Seed data
│
└── src/
    ├── config/
    │   └── cors.js                 # CORS whitelist
    ├── middlewares/
    │   └── authMiddleware.js       # JWT verification
    ├── storage/
    │   └── storage.js              # Cloudinary + Multer setup
    └── routes/
        ├── auth.js
        ├── productRouter.js
        ├── categoryRouter.js
        ├── customerRouter.js
        ├── orderRouter.js
        ├── paymentRouter.js
        ├── productExpireRouter.js
        ├── fileUpload.js
        ├── generateReport.js
        ├── Controller/             # Business logic
        ├── utils/                  # Payway signing, DOCX generation
        └── templete/               # order-template.docx
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database (local or cloud)
- Cloudinary account
- Telegram Bot (via @BotFather)
- ABA Payway merchant credentials (for payment features)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd BackEnd

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values (see section below)

# 4. Run database migrations
npx sequelize-cli db:migrate

# 5. Start development server
npm run dev

# 6. Start production server
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000

# Database (PostgreSQL)
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_HOST=your_db_host
DB_DIALECT=postgres

# Authentication
JWT_SECRET=your_strong_jwt_secret_here

# Cloudinary (Image Storage)
CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET=your_cloudinary_api_secret

# ABA Payway (Payment Gateway)
MERCHANT_ID=your_aba_merchant_id
API_KEY=your_aba_api_key
BASE_URL=https://checkout-sandbox.payway.com.kh

# Telegram Bot (Expiry Notifications)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Frontend URL (for payment redirects)
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 📡 API Endpoints Summary

All endpoints are prefixed with `/api/v1`.

### 🔐 Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new admin user |
| POST | `/auth/login` | Login → returns JWT token |
| GET | `/auth/users` | List all users |

### 📦 Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List products (`?search=`, `?page=`, `?limit=`) |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| POST | `/products/:id/upload` | Upload product image |
| GET | `/products/images/:imageId/download` | Download image |
| DELETE | `/products/delete/:imageId` | Delete image |

### 🏷️ Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | Get all categories |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

### 👤 Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/customers` | Get all customers |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |

### 🛍️ Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Create order with items |
| GET | `/orders/:id/generate-invoice` | Download `.docx` invoice |

### ⏰ Product Expiry
| Method | Endpoint | Description |
|---|---|---|
| GET | `/product-expires` | List expiry records (`?search=`, `?page=`, `?limit=`) |
| GET | `/product-expires/expiring-soon` | Expiring within `?days=30` |
| GET | `/product-expires/:id` | Get single record |
| POST | `/product-expires` | Create expiry record |
| POST | `/product-expires/check-and-notify` | Trigger Telegram notification |
| PUT | `/product-expires/:id` | Update expiry record |
| DELETE | `/product-expires/:id` | Delete expiry record |

### 💳 Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/:orderId` | Initiate ABA Payway session |
| POST | `/payments/check/:tranId` | Verify payment status |

### 🩺 Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server health check |

---

## 📖 Usage Guide

### Create an Order
```json
POST /api/v1/orders
{
  "items": [
    { "productId": 1, "qty": 2 },
    { "productId": 3, "qty": 1 }
  ],
  "discount": 5.00,
  "location": "Phnom Penh, Cambodia"
}
```

### Upload a Product Image
```
POST /api/v1/products/:id/upload
Content-Type: multipart/form-data
Body: file = <image file>
```

### Trigger Expiry Notification
```
POST /api/v1/product-expires/check-and-notify?days=7
```
Sends a formatted Telegram message listing all expired and soon-to-expire products.

### Authenticate (use JWT in subsequent requests)
```json
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```
Response includes a `token` — pass it as `Authorization: Bearer <token>` in protected requests.

---

## 🔮 Future Improvements

- [ ] Apply `authMiddleware` to all protected routes
- [ ] Add role-based access control (Admin / Staff)
- [ ] Add input validation with Joi or Zod
- [ ] Hash customer passwords with bcrypt
- [ ] Fix hardcoded `customerId: 5` in order creation
- [ ] Add `helmet` for HTTP security headers
- [ ] Add rate limiting with `express-rate-limit`
- [ ] Extract shared pagination utility (`src/utils/pagination.js`)
- [ ] Add soft-delete with Sequelize `paranoid: true`
- [ ] Write integration tests (Jest + Supertest)
- [ ] Add Winston/Pino structured logging
- [ ] Set up PM2 for production process management
- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement refresh token mechanism for JWT

---

## 🗃 Database ERD (simplified)

```
category ──< Products >── ProductImage
                  │
                  └──< ProductExpires

Customer ──< Order >── OrderDetail
               │
               └──< Payment
```

---

## 📄 License

ISC — SALA IT © 2026
