# AgriConnect – DynamoDB Table Design

## Design Philosophy

AgriConnect uses a **single-table design** (`AgriConnect-Main`) with a hierarchical key pattern,
augmented by Global Secondary Indexes (GSIs) for access patterns. A separate table is used for
time-series/analytics data to avoid hot partitions.

---

## Table 1: `AgriConnect-Main`

### Key Schema
| Attribute | Type   | Role                    |
|-----------|--------|-------------------------|
| PK        | String | Partition Key           |
| SK        | String | Sort Key                |

### Common Attributes
| Attribute   | Type   | Description                        |
|-------------|--------|------------------------------------|
| entityType  | String | USER, LISTING, TRANSACTION, etc.   |
| createdAt   | String | ISO 8601 timestamp                 |
| updatedAt   | String | ISO 8601 timestamp                 |
| status      | String | Entity-specific status             |
| GSI1PK      | String | GSI1 Partition Key                 |
| GSI1SK      | String | GSI1 Sort Key                      |
| GSI2PK      | String | GSI2 Partition Key                 |
| GSI2SK      | String | GSI2 Sort Key                      |

---

### Entity: USER
```
PK: USER#<userId>
SK: PROFILE

Attributes:
  userId        String   Cognito sub
  email         String
  fullName      String
  phone         String
  role          String   farmer | buyer | agribusiness | logistics | admin
  profileImage  String   S3 key
  location      Map      { lat, lng, address, region }
  farmDetails   Map      { name, size, cropTypes[] }  (farmers only)
  companyName   String   (agribusiness only)
  fleetSize     Number   (logistics only)
  isVerified    Boolean
  rating        Number
  ratingCount   Number
  status        String   active | suspended | pending
  createdAt     String
  updatedAt     String

GSI1PK: ROLE#<role>
GSI1SK: USER#<userId>

GSI2PK: REGION#<region>
GSI2SK: USER#<userId>
```

---

### Entity: LISTING
```
PK: LISTING#<listingId>
SK: METADATA

Attributes:
  listingId     String
  sellerId      String   userId of farmer/agribusiness
  title         String
  description   String
  category      String   crops | byproducts | equipment | inputs | services
  subCategory   String
  quantity      Number
  unit          String   kg | ton | liter | piece | etc.
  pricePerUnit  Number
  currency      String   default USD
  images        List     S3 keys
  location      Map      { lat, lng, address, region }
  availableFrom String   ISO 8601
  availableUntil String  ISO 8601
  tags          List
  status        String   active | sold | expired | draft | removed
  viewCount     Number
  offerCount    Number
  createdAt     String
  updatedAt     String

GSI1PK: SELLER#<sellerId>
GSI1SK: LISTING#<createdAt>#<listingId>

GSI2PK: CATEGORY#<category>
GSI2SK: LISTING#<createdAt>#<listingId>

GSI3PK: STATUS#<status>
GSI3SK: LISTING#<createdAt>#<listingId>

GSI4PK: REGION#<region>
GSI4SK: LISTING#<createdAt>#<listingId>
```

---

### Entity: DEMAND_LISTING (Agribusiness reverse marketplace)
```
PK: DEMAND#<demandId>
SK: METADATA

Attributes:
  demandId      String
  buyerId       String
  title         String
  description   String
  category      String
  quantityNeeded Number
  unit          String
  maxBudget     Number
  currency      String
  location      Map
  deadline      String
  status        String   open | fulfilled | cancelled
  responseCount Number
  createdAt     String
  updatedAt     String

GSI1PK: BUYER#<buyerId>
GSI1SK: DEMAND#<createdAt>#<demandId>

GSI2PK: CATEGORY#<category>
GSI2SK: DEMAND#<createdAt>#<demandId>
```

---

### Entity: TRANSACTION
```
PK: TRANSACTION#<transactionId>
SK: METADATA

Attributes:
  transactionId String
  listingId     String
  sellerId      String
  buyerId       String
  quantity      Number
  agreedPrice   Number
  currency      String
  status        String   pending | accepted | in_delivery | completed | cancelled | disputed
  offerHistory  List     [{ price, by, at, note }]
  deliveryId    String   (populated when delivery assigned)
  notes         String
  createdAt     String
  updatedAt     String

GSI1PK: SELLER#<sellerId>
GSI1SK: TRANSACTION#<createdAt>#<transactionId>

GSI2PK: BUYER#<buyerId>
GSI2SK: TRANSACTION#<createdAt>#<transactionId>

GSI3PK: LISTING#<listingId>
GSI3SK: TRANSACTION#<createdAt>#<transactionId>
```

---

### Entity: MESSAGE (Conversation Thread)
```
PK: CONVERSATION#<conversationId>
SK: MESSAGE#<timestamp>#<messageId>

Attributes:
  messageId     String
  conversationId String
  senderId      String
  receiverId    String
  content       String
  attachments   List     S3 keys
  isRead        Boolean
  createdAt     String

Conversation Metadata item:
PK: CONVERSATION#<conversationId>
SK: METADATA
  participants  List     [userId1, userId2]
  relatedListingId String
  lastMessageAt String
  createdAt     String

GSI1PK: USER#<userId>
GSI1SK: CONVERSATION#<lastMessageAt>#<conversationId>
```

---

### Entity: DELIVERY
```
PK: DELIVERY#<deliveryId>
SK: METADATA

Attributes:
  deliveryId    String
  transactionId String
  providerId    String   logistics userId
  pickupLocation  Map    { lat, lng, address }
  dropoffLocation Map    { lat, lng, address }
  scheduledDate String
  status        String   assigned | picked_up | in_transit | delivered | failed
  trackingEvents List    [{ status, timestamp, location }]
  estimatedArrival String
  actualArrival String
  notes         String
  createdAt     String
  updatedAt     String

GSI1PK: PROVIDER#<providerId>
GSI1SK: DELIVERY#<scheduledDate>#<deliveryId>

GSI2PK: TRANSACTION#<transactionId>
GSI2SK: DELIVERY#<deliveryId>
```

---

### Entity: REVIEW
```
PK: USER#<revieweeId>
SK: REVIEW#<createdAt>#<reviewId>

Attributes:
  reviewId      String
  reviewerId    String
  revieweeId    String
  transactionId String
  rating        Number   1-5
  comment       String
  createdAt     String

GSI1PK: REVIEWER#<reviewerId>
GSI1SK: REVIEW#<createdAt>#<reviewId>
```

---

### Entity: NOTIFICATION
```
PK: USER#<userId>
SK: NOTIFICATION#<createdAt>#<notificationId>

Attributes:
  notificationId String
  userId        String
  type          String   offer | message | delivery | system | price_alert
  title         String
  body          String
  isRead        Boolean
  relatedId     String   transactionId | listingId | etc.
  createdAt     String
```

---

### Entity: AI_QUERY
```
PK: USER#<userId>
SK: AI_QUERY#<createdAt>#<queryId>

Attributes:
  queryId       String
  userId        String
  queryType     String   crop_advice | pricing | byproduct_suggestion | market_trend
  inputData     Map
  response      String   Gemini response
  tokens        Number
  createdAt     String
```

---

## Table 2: `AgriConnect-Analytics`

Used for platform-wide metrics, avoiding hot-partition issues on main table.

```
PK: METRIC#<metricName>
SK: DATE#<YYYY-MM-DD>

Attributes:
  value         Number
  breakdown     Map      optional dimension breakdown
  updatedAt     String
```

---

## Global Secondary Indexes Summary

| GSI Name | GSI PK       | GSI SK              | Purpose                          |
|----------|--------------|---------------------|----------------------------------|
| GSI1     | GSI1PK       | GSI1SK              | Multi-entity flexible queries    |
| GSI2     | GSI2PK       | GSI2SK              | Category / region-based queries  |
| GSI3     | GSI3PK       | GSI3SK              | Cross-entity joins               |
| GSI4     | GSI4PK       | GSI4SK              | Geo/status-based listing queries |

All GSIs use PAY_PER_REQUEST billing mode with on-demand capacity.
