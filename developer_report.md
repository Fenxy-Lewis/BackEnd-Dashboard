# 📋 Developer Summary Report — SALA Express Backend

> Generated: 2026-05-02 | Project Level: **Intermediate**

---

## 1. 🗂 Project Overview

### What type of project is this?
A **RESTful API backend** for a product management and POS (Point-of-Sale) dashboard system. It serves a React frontend deployed on Vercel.

### Main purpose of the system
- Manage products, categories, and inventory
- Handle customer records and orders
- Process payments via **ABA Payway / KHQR** (Cambodia's payment gateway)
- Track product expiry dates with automated Telegram notifications
- Generate downloadable `.docx` invoices for orders

### Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (CommonJS) |
| **Framework** | Express.js v5 |
| **Database** | PostgreSQL (hosted on Render) |
| **ORM** | Sequelize v6 with Sequelize CLI |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **File/Image Storage** | Cloudinary via `multer-storage-cloudinary` |
| **Payment** | ABA Payway sandbox (KHQR / ABA Pay) |
| **Notifications** | Telegram Bot API |
| **Scheduling** | `node-cron` |
| **Invoice Generation** | `docxtemplater` + `pizzip` |
| **Date Handling** | `dayjs` |
| **HTTP Client** | `axios` |
| **Dev Tool** | `nodemon` |

---

## 2. 🗃 Models / Database

### All Models (9 tables)

| Model | Table | Purpose |
|---|---|---|
| `User` | Users | Admin/staff accounts for dashboard login |
| `category` | categories | Product categories |
| `Products` | Products | Core product catalog |
| `ProductImage` | ProductImages | Product images stored on Cloudinary |
| `ProductExpires` | ProductExpires | Expiry date tracking per product batch |
| `Customer` | Customers | Customer records for orders |
| `Order` | Orders | Sales orders with totals |
| `OrderDetail` | OrderDetails | Line items per order |
| `Payment` | Payments | ABA Payway payment records |

### Model Relationships

```
category ──────────── Products          (One-to-Many)
                           │
                           ├────── ProductImage     (One-to-Many)
                           └────── ProductExpires   (One-to-Many)

Customer ──────────── Order             (One-to-Many)
                           │
                           ├────── OrderDetail      (One-to-Many)
                           └────── Payment          (One-to-Many)
```

### Important Fields per Model

**User** — `firstName`, `lastName`, `email`, `userName`, `password` (hashed), `is_active`

**category** — `name`, `is_active`

**Products** — `name`, `description`, `color`, `price` (DECIMAL), `qty`, `categoryId` (FK), `isActive`

**ProductImage** — `productId` (FK), `fileName`, `publicId` (Cloudinary), `imageUrl` (Cloudinary URL)

**ProductExpires** — `productId` (FK), `expiryDate`, `batchNumber`, `isNotified` (BOOLEAN)

**Customer** — `firstname`, `lastname`, `phone`, `username`, `email`, `isActive`

**Order** — `customerId` (FK), `orderNumber` (unique string), `total`, `discount`, `orderDate`, `location`

**OrderDetail** — `orderId` (FK), `productId` (FK), `productName` (snapshot), `productprice` (snapshot), `qty`, `amount`

**Payment** — `orderId` (FK), `paywayTranId`, `method`, `status` (PENDING/PAID/FAILED), `paidAt`, `remark`, `amount`

---

## 3. 🧠 Controllers / Business Logic

Controllers are located in `src/routes/Controller/`.

### `productController.js`
**Responsibility:** Full CRUD for the product catalog with search and pagination.

| Function | Description |
|---|---|
| `getProducts` | Paginated list with optional `?search=name`, includes category and images |
| `getProductById` | Fetch single product by PK with category + images |
| `createProduct` | Create product; validates `name`, `price`, `qty` |
| `updateProduct` | Partial update; 404 if not found |
| `deleteProduct` | Hard-delete product by PK |

---

### `categoryController.js`
**Responsibility:** CRUD for product categories.

| Function | Description |
|---|---|
| `getAll` | Returns all categories with nested products |
| `create` | Creates new category |
| `update` | Updates category name/status |
| `remove` | Hard-deletes category |

---

### `customerController.js`
**Responsibility:** CRUD for customer records.

| Function | Description |
|---|---|
| `getAll` | Returns all customers |
| `create` | Creates customer (note: stores `password` in plaintext — bug) |
| `update` | Partial update |
| `remove` | Hard-delete |

---

### `orderController.js`
**Responsibility:** Create orders with auto-calculated totals and invoice numbers.

| Function | Description |
|---|---|
| `generateInvoiceNumber` | Generates `INV-YYYYMMDD-XXXXXXXXX` format |
| `create` | Validates items array, fetches products, calculates total, creates order + order details |

> ⚠️ **Hardcoded `customerId: 5`** — customer is not dynamically resolved from the request.

---

### `paymentController.js`
**Responsibility:** Integrates with ABA Payway for KHQR payments.

| Function | Description |
|---|---|
| `createPayment` | Creates a `PENDING` payment record, builds ABA Payway payload + HMAC-SHA512 hash |
| `checkTransaction` | Verifies payment status against ABA API, updates record to PAID/FAILED/PENDING |

---

### `productExpireController.js`
**Responsibility:** Full CRUD for expiry tracking + Telegram notifications + cron scheduler. (Largest controller at 553 lines)

| Function | Description |
|---|---|
| `getProductExpires` | Paginated list, searchable by `batchNumber` |
| `getProductExpireById` | Single record by PK |
| `getExpiringSoon` | Records expiring within `?days=N` |
| `createProductExpire` | Validates productId exists before creating |
| `updateProductExpire` | Partial update with product FK validation |
| `deleteProductExpire` | Hard-delete |
| `checkAndNotifyExpiring` | Manual trigger: sends formatted Telegram message |
| `startExpiryNotificationCron` | Auto-runs at 07:00 AM (Asia/Phnom_Penh) via `node-cron` |

---

### `fileUpload.js` (route-level controller)
**Responsibility:** Cloudinary image upload and deletion for products.

| Function | Description |
|---|---|
| `POST /:id/upload` | Upload image via Multer → Cloudinary, save URL to DB |
| `GET /images/:imageId/download` | Download image from local `uploads/` folder |
| `DELETE /delete/:imageId` | Delete from Cloudinary + DB |

---

### `generateReport.js` (route-level)
**Responsibility:** Generate a `.docx` invoice for an order.

| Function | Description |
|---|---|
| `GET /:id/generate-invoice` | Renders `order-template.docx` with order data via Docxtemplater |

---

## 4. 🛣 Routes / API Endpoints

Base URL: `/api/v1`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login → returns JWT token |
| `GET` | `/auth/users` | Get all users (unprotected ⚠️) |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | Get all products (`?search=`, `?page=`, `?limit=`) |
| `GET` | `/products/:id` | Get single product |
| `POST` | `/products` | Create product |
| `PUT` | `/products/:id` | Update product |
| `DELETE` | `/products/:id` | Delete product |
| `POST` | `/products/:id/upload` | Upload product image to Cloudinary |
| `GET` | `/products/images/:imageId/download` | Download product image |
| `DELETE` | `/products/delete/:imageId` | Delete product image |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | Get all categories (with products) |
| `POST` | `/categories` | Create category |
| `PUT` | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Delete category |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/customers` | Get all customers |
| `POST` | `/customers` | Create customer |
| `PUT` | `/customers/:id` | Update customer |
| `DELETE` | `/customers/:id` | Delete customer |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders` | Create order with items |
| `GET` | `/orders/:id/generate-invoice` | Download `.docx` invoice |

### Product Expiry
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/product-expires` | List all expiry records (`?search=`, `?page=`, `?limit=`) |
| `GET` | `/product-expires/expiring-soon` | Expiring within `?days=30` |
| `GET` | `/product-expires/:id` | Get single record |
| `POST` | `/product-expires` | Create expiry record |
| `POST` | `/product-expires/check-and-notify` | Manual Telegram notification trigger |
| `PUT` | `/product-expires/:id` | Update expiry record |
| `DELETE` | `/product-expires/:id` | Delete expiry record |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payments/:orderId` | Create ABA Payway payment session |
| `POST` | `/payments/check/:tranId` | Check transaction status from ABA |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |

---

## 5. 🔐 Authentication & Security

### Login / Register
- **Register:** Hashes password with `bcryptjs` (cost factor 10), creates `User` record.
- **Login:** Compares password, returns a **JWT token** (expires in `1d`).

### JWT Middleware (`authMiddleware.js`)
- Expects `Authorization: Bearer <token>` header.
- Decodes token using `JWT_SECRET` from `.env`.
- Calls `next()` on success, returns `401` on failure.

> ⚠️ **Critical issue:** The `decoded` variable is assigned but never used — user data from token is NOT attached to `req` (e.g., `req.user`). This means no downstream handler can access the authenticated user.

### Route Protection
> ⚠️ **Critical issue:** `authMiddleware` is imported in `App.js` but **never applied to any route**. All API endpoints are publicly accessible without authentication.

### CORS
- Configured in `src/config/cors.js`
- Whitelisted origins: `https://productsystemmanagementv1.vercel.app` and `http://localhost:5173`
- Methods allowed: GET, POST, PUT, DELETE, PATCH

### Role System
- **None implemented.** The `User` model has no `role` field. There is no admin/user distinction.

### Password Security in Customer Module
> ⚠️ `customerController.js` accepts and stores `password` in plaintext — no hashing applied.

### Payment Security
- ABA Payway requests are signed using **HMAC-SHA512** with a private API key — this is correctly implemented.
- API credentials (`API_KEY`, `MERCHANT_ID`) stored in `.env` — correct.

### Validation
- Basic field presence checks exist in most controllers.
- No schema validation library (e.g., Joi, Zod, express-validator) is used anywhere.
- No input sanitization against SQL injection (Sequelize parameterized queries help here, but there's no XSS protection).

---

## 6. 📁 Project Structure

```
BackEnd/
├── App.js                        # Entry point: middleware setup, route mounting, cron start
├── package.json
├── .env                          # Environment variables (DO NOT commit)
├── requestLogger.js              # Custom IP + User-Agent logger middleware
│
├── config/
│   └── config.js                 # Sequelize DB config (dev/test/prod), reads from .env
│
├── models/                       # Sequelize model definitions (auto-loaded by index.js)
│   ├── index.js                  # Scans models/, initializes Sequelize, calls .associate()
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
├── migrations/                   # Sequelize migration files (12 total)
├── seeders/                      # Empty (no seed data)
│
└── src/
    ├── config/
    │   └── cors.js               # CORS whitelist configuration
    │
    ├── middlewares/
    │   └── authMiddleware.js     # JWT verification middleware (unused in routes)
    │
    ├── storage/
    │   └── storage.js            # Cloudinary v2 + multer-storage-cloudinary setup
    │
    ├── uploads/                  # Local upload folder (likely for legacy local storage)
    │
    └── routes/
        ├── auth.js               # POST /register, POST /login, GET /users
        ├── productRouter.js
        ├── categoryRouter.js
        ├── customerRouter.js
        ├── orderRouter.js
        ├── paymentRouter.js
        ├── productExpireRouter.js
        ├── fileUpload.js         # Image upload/download/delete
        ├── generateReport.js     # DOCX invoice generation
        │
        ├── Controller/
        │   ├── productController.js
        │   ├── categoryController.js
        │   ├── customerController.js
        │   ├── orderController.js
        │   ├── paymentController.js
        │   └── productExpireController.js
        │
        ├── utils/
        │   ├── payway.js         # ABA Payway HMAC signing helpers
        │   └── generateOrderDoc.js # Docxtemplater invoice renderer
        │
        └── templete/
            └── order-template.docx  # DOCX template (note: folder name typo)
```

---

## 7. ⭐ Important Features

| Feature | Status |
|---|---|
| Product CRUD with search + pagination | ✅ |
| Category CRUD | ✅ |
| Customer CRUD | ✅ |
| Order creation with auto-invoice number | ✅ |
| Cloudinary image upload/delete | ✅ |
| Product expiry tracking (CRUD) | ✅ |
| Expiring-soon filter | ✅ |
| Telegram notification (manual trigger) | ✅ |
| Daily cron job for expiry alerts (07:00 AM ICT) | ✅ |
| ABA Payway KHQR payment integration | ✅ |
| Payment status verification | ✅ |
| `.docx` invoice generation and download | ✅ |
| Request logging (IP, browser, OS) | ✅ |
| JWT authentication middleware | ⚠️ (defined, not applied) |
| Role-based access control | ❌ Not implemented |
| Input validation library | ❌ Not implemented |
| Unit/Integration tests | ❌ Not implemented |
| Soft-delete | ❌ Not implemented |

---

## 8. 🔍 Code Quality Review

### ✅ Strengths
- **Consistent response format** — all controllers return `{ success, message, data }` — great for frontend consumption.
- **Pagination is well-implemented** — clamped `limit` (max 100), proper `totalPages`, `hasNextPage`, `hasPrevPage`.
- **`productExpireController.js` is well-structured** — uses shared helper functions (`parsePagination`, `paginatedResponse`, `buildNotificationMessage`), has clear JSDoc comments.
- **HMAC-SHA512 payment signing** is correctly implemented for ABA Payway.
- **Cloudinary integration** is clean and handles both upload and delete with `publicId`.
- **Environment variable usage** — all secrets in `.env`, never hardcoded (mostly).
- **Sequelize associations** are properly defined with named aliases.

### ⚠️ Weaknesses & Issues

| Severity | Issue | Location |
|---|---|---|
| 🔴 Critical | `authMiddleware` is imported but **never applied** to any route — all endpoints are public | `App.js` |
| 🔴 Critical | `decoded` variable in `authMiddleware` is assigned but discarded — `req.user` is never set | `authMiddleware.js:16` |
| 🔴 Critical | Customer `password` stored **in plaintext** — no hashing | `customerController.js:23` |
| 🔴 Critical | `customerId: 5` is **hardcoded** in order creation — orders are always linked to one customer | `orderController.js:66` |
| 🟠 High | `GET /auth/users` is **public** — exposes all user records with no auth | `auth.js:33` |
| 🟠 High | **No input validation library** — only manual field checks, inconsistent coverage | All controllers |
| 🟡 Medium | `src/routes/generateReport.js` has a **circular path** reference (uses `../../src/routes/...` from inside `src/routes/`) | `generateReport.js:2` |
| 🟡 Medium | **Typo in folder name**: `templete` should be `template` | `src/routes/templete/` |
| 🟡 Medium | `isNotified` flag logic is commented out — notifications always repeat, one-time mode is disabled | `productExpireController.js:455-457` |
| 🟡 Medium | No `ORDER BY` on `Customer.findAll()` — result order is non-deterministic | `customerController.js` |
| 🟡 Medium | `checkTransaction` has no `res.json()` call in the `catch` block — unhandled error silently fails | `paymentController.js:206-208` |
| 🟢 Low | `console.log(file)` left in production upload handler | `fileUpload.js:20` |
| 🟢 Low | `PORT` variable is read from env but no default fallback | `App.js:23` |
| 🟢 Low | No `helmet` middleware — missing HTTP security headers | `App.js` |
| 🟢 Low | No rate limiting | `App.js` |
| 🟢 Low | `.env` file contains real credentials and is not in `.gitignore` (based on file presence in root) | `.env` |

### 🔁 Duplicate Code
- `parsePagination` and `paginatedResponse` are only defined in `productExpireController.js` but similar pagination logic is manually inlined in `productController.js`. Should be extracted to a shared utility.
- `findByPk + 404 check` pattern is repeated in every controller — could be a reusable helper.

---

## 9. 💡 Suggestions to Improve

### Security (Priority: High)
1. **Apply `authMiddleware` to all protected routes** in `App.js` — right now nothing is protected.
2. **Attach decoded user to `req.user`** inside `authMiddleware` so controllers can use it.
3. **Hash customer passwords** with bcrypt in `customerController.create`.
4. **Add `helmet`** for HTTP security headers: `npm install helmet`, then `app.use(helmet())`.
5. **Add rate limiting** with `express-rate-limit` to prevent brute-force and abuse.
6. **Add `.env` to `.gitignore`** immediately — real credentials are exposed.

### Input Validation (Priority: High)
7. **Use Joi or Zod** for schema-based request validation — create a `validators/` folder and validate before controllers run.

### Architecture (Priority: Medium)
8. **Extract shared utils** — move `parsePagination` and `paginatedResponse` to `src/utils/pagination.js`.
9. **Separate auth logic** — auth routes currently contain their logic inline; move to `src/routes/Controller/authController.js`.
10. **Fix the hardcoded `customerId: 5`** — resolve the customer from `req.user` or accept `customerId` from the request body with validation.
11. **Fix the `generateReport.js` path** — use `path.join(__dirname, ...)` correctly instead of relative `../../src/routes/...`.
12. **Rename `templete` → `template`** to fix the typo.

### Clean Code (Priority: Low)
13. **Remove `console.log(file)`** from the upload handler.
14. **Add error response in `checkTransaction` catch block**.
15. **Add default PORT fallback**: `const PORT = process.env.PORT || 3000`.
16. **Fix missing `ORDER BY`** on Customer and Category queries.
17. **Enable one-time notification mode** by uncommenting the `isNotified` update block, or document the intentional choice clearly.

### Scalability (Priority: Medium)
18. **Add database connection pooling config** in `config.js` (`pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }`).
19. **Add soft-delete** using Sequelize `paranoid: true` to prevent accidental data loss.
20. **Implement a service layer** — move DB queries out of controllers into `src/services/` files.

### Production Readiness Checklist
- [ ] Remove or guard all `console.log` debug statements
- [ ] Apply `authMiddleware` to all private routes
- [ ] Add `.env` to `.gitignore`
- [ ] Add `helmet` and `express-rate-limit`
- [ ] Add input validation (Joi/Zod)
- [ ] Fix hardcoded `customerId: 5`
- [ ] Hash customer passwords
- [ ] Write at least basic integration tests (Supertest + Jest)
- [ ] Set up proper error handling middleware
- [ ] Add a process manager (PM2) for production deployment
- [ ] Add proper logging (Winston or Pino) instead of raw `console.log`

---

## 10. ⚡ Quick Summary

| Item | Count |
|---|---|
| **Total Models** | 9 |
| **Total Controllers** | 6 controllers + 2 route-level handlers |
| **Total Route Files** | 9 |
| **Total API Endpoints** | ~28 |
| **Total Migrations** | 12 |
| **Total Seeders** | 0 |
| **Lines of Code (approx)** | ~1,300 |

### Main Modules
`Auth` · `Products` · `Categories` · `Customers` · `Orders` · `ProductExpiry` · `Payments` · `File Upload` · `Invoice Generation`

### Project Level
> **🟡 Intermediate** — Good foundational architecture and real-world integrations (payment gateway, Cloudinary, Telegram, cron jobs). However, critical security gaps (unprotected routes, plaintext passwords, hardcoded values) and missing validation need to be addressed before production use.
