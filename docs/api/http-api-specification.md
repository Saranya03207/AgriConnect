# AgriConnect – API Gateway HTTP API v2 Specification

## 1. Gateway & Authentication Standards

- **API Protocol**: Amazon API Gateway HTTP API (Payload Format v2.0).
- **Authorizer**: Native JWT Authorizer backed by Amazon Cognito User Pool.
- **Header**: `Authorization: Bearer <ID_TOKEN_OR_ACCESS_TOKEN>`
- **CORS Handling**: Native Gateway CORS with allowed origins configured per environment.

---

## 2. API Routes Matrix

### A. Users & Profiles (`functions/users/handler.py`)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/users/me` | Yes | All Authenticated | Get current authenticated user profile |
| `PUT` | `/users/me` | Yes | All Authenticated | Update user profile details (location, phone, bio) |
| `GET` | `/users/{userId}` | Optional | Public / All | Get public seller/business profile |

---

### B. Listings & Uploads (`functions/listings/handler.py`)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/listings` | No | Public | List active items with category & status filters |
| `GET` | `/listings/{listingId}` | No | Public | Get full details of a specific listing |
| `POST` | `/listings` | Yes | `SEED_PRODUCER`, `FARMER`, `BYPRODUCT_SELLER`, `SERVICE_PROVIDER`, `PROCESSOR` | Create a new listing |
| `PUT` | `/listings/{listingId}` | Yes | Owner or `ADMIN` | Update listing price, quantity, or status |
| `DELETE` | `/listings/{listingId}`| Yes | Owner or `ADMIN` | Deactivate/soft-delete a listing |
| `POST` | `/listings/upload` | Yes | All Authenticated | Request presigned S3 upload URL for product media |

---

### C. Search & Discovery (`functions/search/handler.py`)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/search` | No | Public | Filtered search by query string, district, price, category |

---

### D. Purchase Requests / Procurement (`functions/orders/handler.py` or dedicated)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/purchase-requests` | No | Public | List open buyer RFQs & requirements |
| `POST` | `/purchase-requests` | Yes | `BUYER`, `PROCESSOR`, `FARMER` | Post a bulk buying requirement |
| `GET` | `/purchase-requests/{requestId}` | No | Public | Get requirement specifications and terms |

---

### E. Orders & Transactions (`functions/orders/handler.py`)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/orders` | Yes | All Authenticated | Get user's orders (Buyer or Seller perspective) |
| `GET` | `/orders/{orderId}` | Yes | Order Participants / `ADMIN` | Get comprehensive order details |
| `POST` | `/orders` | Yes | `BUYER`, `PROCESSOR`, `FARMER` | Initiate order against a listing |
| `PUT` | `/orders/{orderId}` | Yes | Order Participants / `ADMIN` | Advance order state (`ACCEPTED`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`) |

---

### F. Communication & Notifications (`functions/messages/` & `notifications/`)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/messages` | Yes | All Authenticated | Get user conversations or message thread |
| `POST` | `/messages` | Yes | All Authenticated | Send a 1-on-1 message |
| `GET` | `/notifications` | Yes | All Authenticated | Get user notifications list |
| `PUT` | `/notifications/{notificationId}/read` | Yes | Recipient | Mark notification as acknowledged |

---

### G. AI Intelligence (`functions/ai/handler.py`)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/ai/search` | Optional | Public / All | Natural-language query to structured inventory search |
| `POST` | `/ai/listing-assistant`| Yes | Sellers / Providers | Formulate optimized listing titles, specs & pricing |
| `POST` | `/ai/chat` | Yes | All Authenticated | Conversational agricultural & platform advisor |

---

### H. Administration (`functions/admin/handler.py`)
| Method | Route Key | Auth Required | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/admin/users` | Yes | `ADMIN` | List and filter all system users |
| `PUT` | `/admin/users/{userId}/status` | Yes | `ADMIN` | Verify, suspend, or reactivate user account |
| `GET` | `/admin/stats` | Yes | `ADMIN` | Platform metrics (active users, GMV, listings) |
