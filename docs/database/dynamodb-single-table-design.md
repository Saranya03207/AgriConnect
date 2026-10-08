# AgriConnect – DynamoDB Single-Table Design (`AgriConnect-Main`)

## 1. Table Overview & Primary Keys

AgriConnect uses a single-table design named **`AgriConnect-Main`** to satisfy transactional workflows, relationship integrity, and high-performance queries without relational overhead.

### Primary Keys
| Attribute | Type | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **PK** | String | Partition Key (Entity namespace + Unique ID) | `USER#usr_123`, `LISTING#lst_456` |
| **SK** | String | Sort Key (Hierarchy / Sub-entity / Timestamp) | `PROFILE`, `METADATA`, `MSG#2026-09-30T10:00:00Z` |

### Global Secondary Indexes (GSIs)
| Index Name | Partition Key (`PK`) | Sort Key (`SK`) | Projection | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`GSI1`** | `GSI1PK` (String) | `GSI1SK` (String) | ALL | Public marketplace discovery by Category, Type & Status |
| **`GSI2`** | `GSI2PK` (String) | `GSI2SK` (String) | ALL | Reverse lookup by User ID (My Listings, My Orders, Inboxes) |
| **`GSI3`** | `GSI3PK` (String) | `GSI3SK` (String) | ALL | Geographic region indexing & Secondary participant lookup |

---

## 2. Entity Schemas & Key Mappings

### A. USER & PROFILE
- **PK**: `USER#<userId>`
- **SK**: `PROFILE`
- **GSI1PK**: `ROLE#<role>` | **GSI1SK**: `USER#<userId>`
- **GSI2PK**: `USERS` | **GSI2SK**: `CREATED#<createdAt>`
- **Attributes**:
  - `userId` (String): Cognito sub ID
  - `email` (String)
  - `displayName` (String)
  - `role` (String): `SEED_PRODUCER` | `FARMER` | `BYPRODUCT_SELLER` | `BUYER` | `SERVICE_PROVIDER` | `PROCESSOR` | `ADMIN`
  - `phone` (String)
  - `location`: Map `{ state, district, taluk, village, pincode, coordinates: { lat, lng } }`
  - `roleSpecificDetails`: Map:
    - *Seed Producer*: `{ licenseNumber, seedVarieties, certificationBody }`
    - *Farmer*: `{ farmSizeAcres, primaryCrops, irrigationType }`
    - *Byproduct Seller*: `{ primaryResidues, recurringAvailability }`
    - *Buyer*: `{ businessName, gstNumber, procurementInterests }`
    - *Service Provider*: `{ serviceTypes, machineryFleetSize, labourCapacity }`
    - *Processor*: `{ plantCapacityTonsPerDay, processingTypes, rawMaterialsRequired }`
  - `isVerified` (Boolean)
  - `rating` (Number)
  - `ratingCount` (Number)
  - `createdAt` (String: ISO8601)
  - `updatedAt` (String: ISO8601)

---

### B. LISTING (Seeds, Crops, By-products, Services)
- **PK**: `LISTING#<listingId>`
- **SK**: `METADATA`
- **GSI1PK**: `CATEGORY#<category>#STATUS#<status>` | **GSI1SK**: `CREATED#<createdAt>`
- **GSI2PK**: `USER#<sellerId>` | **GSI2SK**: `LISTING#<createdAt>`
- **GSI3PK**: `DISTRICT#<district>` | **GSI3SK**: `CATEGORY#<category>`
- **Attributes**:
  - `listingId` (String: `lst_<uuid>`)
  - `sellerId` (String: Cognito sub)
  - `sellerName` (String)
  - `sellerRole` (String)
  - `category` (String): `SEED` | `CROP` | `BYPRODUCT` | `SERVICE`
  - `subCategory` (String): e.g., `COCONUT_HUSK`, `PADDY_STRAW`, `HYBRID_MAIZE`, `TRACTOR_HARVESTER`
  - `title` (String)
  - `description` (String)
  - `quantity` (Number)
  - `unit` (String): `KG`, `TONNES`, `QUINTAL`, `BAGS`, `ACRES`, `HOURS`
  - `pricePerUnit` (Number)
  - `currency` (String, default: `INR`)
  - `location`: Map `{ state, district, pincode, landmark }`
  - `images`: List of Strings (S3 object keys)
  - `certificates`: List of Strings (S3 object keys)
  - `status` (String): `ACTIVE` | `PENDING_APPROVAL` | `SOLD_OUT` | `INACTIVE`
  - `expiryDate` (String: ISO8601)
  - `createdAt` (String: ISO8601)
  - `updatedAt` (String: ISO8601)

---

### C. PURCHASE_REQUEST (Buyer / Processor Procurement & RFQs)
- **PK**: `REQUEST#<requestId>`
- **SK**: `METADATA`
- **GSI1PK**: `REQUEST_CATEGORY#<category>#STATUS#<status>` | **GSI1SK**: `DEADLINE#<deadline>`
- **GSI2PK**: `USER#<buyerId>` | **GSI2SK**: `REQUEST#<createdAt>`
- **GSI3PK**: `DISTRICT#<district>` | **GSI3SK**: `CATEGORY#<category>`
- **Attributes**:
  - `requestId` (String: `req_<uuid>`)
  - `buyerId` (String: Cognito sub)
  - `buyerName` (String)
  - `buyerRole` (String: `BUYER` | `PROCESSOR`)
  - `title` (String)
  - `requiredCategory` (String)
  - `material` (String)
  - `targetQuantity` (Number)
  - `unit` (String)
  - `maxBudgetPerUnit` (Number, optional)
  - `deliveryLocation`: Map
  - `deadline` (String: ISO8601)
  - `status` (String): `OPEN` | `FULFILLED` | `CLOSED`
  - `bidsCount` (Number)
  - `createdAt` (String: ISO8601)

---

### D. ORDER / TRANSACTION
- **PK**: `ORDER#<orderId>`
- **SK**: `METADATA`
- **GSI1PK**: `ORDER_STATUS#<status>` | **GSI1SK**: `CREATED#<createdAt>`
- **GSI2PK**: `USER#<buyerId>` | **GSI2SK**: `ORDER#<createdAt>`
- **GSI3PK**: `USER#<sellerId>` | **GSI3SK**: `ORDER#<createdAt>`
- **Attributes**:
  - `orderId` (String: `ord_<uuid>`)
  - `listingId` (String)
  - `buyerId` (String)
  - `sellerId` (String)
  - `itemTitle` (String)
  - `category` (String)
  - `quantity` (Number)
  - `unit` (String)
  - `totalAmount` (Number)
  - `currency` (String: `INR`)
  - `status` (String): `INITIATED` | `ACCEPTED` | `IN_TRANSIT` | `COMPLETED` | `CANCELLED` | `DISPUTED`
  - `deliveryAddress`: Map
  - `createdAt` (String: ISO8601)
  - `updatedAt` (String: ISO8601)

---

### E. MESSAGE (Conversation & Real-Time Chat)
- **PK**: `CONV#<conversationId>`
- **SK**: `MSG#<timestamp>#<messageId>`
- **GSI1PK**: `CONV#<conversationId>` | **GSI1SK**: `TIMESTAMP#<timestamp>`
- **GSI2PK**: `USER#<recipientId>` | **GSI2SK**: `UNREAD#<timestamp>`
- **Attributes**:
  - `conversationId` (String: `usrA_usrB` sorted)
  - `messageId` (String)
  - `senderId` (String)
  - `recipientId` (String)
  - `content` (String)
  - `attachments`: List of S3 keys
  - `isRead` (Boolean)
  - `timestamp` (String: ISO8601)

---

### F. NOTIFICATION
- **PK**: `USER#<userId>`
- **SK**: `NOTIF#<timestamp>#<notificationId>`
- **GSI2PK**: `USER#<userId>` | **GSI2SK**: `STATUS#<status>#<timestamp>`
- **Attributes**:
  - `notificationId` (String)
  - `userId` (String)
  - `title` (String)
  - `message` (String)
  - `type` (String): `ORDER_UPDATE`, `INQUIRY`, `PRICE_ALERT`, `SYSTEM`
  - `isRead` (Boolean)
  - `referenceUrl` (String)
  - `timestamp` (String: ISO8601)

---

### G. AI_REQUEST & QUERY_LOG (Internal Audit & RAG Cache)
- **PK**: `USER#<userId>`
- **SK**: `AI_QUERY#<timestamp>#<queryId>`
- **Attributes**:
  - `queryId` (String)
  - `rawQuery` (String)
  - `extractedEntities`: Map (Intent, Category, Material, Quantity, Location)
  - `matchedListingsCount` (Number)
  - `tokensConsumed` (Number)
  - `timestamp` (String: ISO8601)
