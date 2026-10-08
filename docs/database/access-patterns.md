# AgriConnect – DynamoDB Access Patterns

This document maps all application access patterns directly to DynamoDB queries or operations against `AgriConnect-Main`.

---

## 1. Access Patterns Table

| Pattern ID | Access Pattern Description | Target / Index | Key Condition Expression | Filter Expression / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **AP-01** | Get user profile by Cognito Sub | Primary Table | `PK = USER#<userId> AND SK = PROFILE` | Direct `GetItem` |
| **AP-02** | Update user profile | Primary Table | `PK = USER#<userId> AND SK = PROFILE` | `UpdateItem` with allowed fields |
| **AP-03** | Get users by role (Admin / Directory) | `GSI1` | `GSI1PK = ROLE#<role>` | Query |
| **AP-04** | Get single listing by ID | Primary Table | `PK = LISTING#<listingId> AND SK = METADATA` | Direct `GetItem` |
| **AP-05** | Browse active listings by category | `GSI1` | `GSI1PK = CATEGORY#<category>#STATUS#ACTIVE` | ScanIndexForward=false (latest first) |
| **AP-06** | Get listings created by a specific user ("My Listings") | `GSI2` | `GSI2PK = USER#<userId> AND begins_with(GSI2SK, "LISTING#")` | Query |
| **AP-07** | Search listings by District / Region | `GSI3` | `GSI3PK = DISTRICT#<district> AND GSI3SK = CATEGORY#<category>` | Query |
| **AP-08** | Create new listing | Primary Table | `PK = LISTING#<listingId>, SK = METADATA` | `PutItem` |
| **AP-09** | Update listing (price, quantity, status) | Primary Table | `PK = LISTING#<listingId> AND SK = METADATA` | `UpdateItem` (Ownership checked in code) |
| **AP-10** | Soft-delete / deactivate listing | Primary Table | `PK = LISTING#<listingId> AND SK = METADATA` | Update status to `INACTIVE`, remove from GSI1PK |
| **AP-11** | Browse open purchase requests (RFQs) | `GSI1` | `GSI1PK = REQUEST_CATEGORY#<category>#STATUS#OPEN` | Query sorted by deadline |
| **AP-12** | Get purchase requests by buyer | `GSI2` | `GSI2PK = USER#<buyerId> AND begins_with(GSI2SK, "REQUEST#")` | Query |
| **AP-13** | Create new order / transaction | Primary Table | `PK = ORDER#<orderId>, SK = METADATA` | `PutItem` |
| **AP-14** | Get order details by ID | Primary Table | `PK = ORDER#<orderId> AND SK = METADATA` | `GetItem` (Caller must be buyer, seller, or admin) |
| **AP-15** | Get orders placed by buyer ("My Purchases") | `GSI2` | `GSI2PK = USER#<buyerId> AND begins_with(GSI2SK, "ORDER#")` | Query |
| **AP-16** | Get orders received by seller ("My Sales") | `GSI3` | `GSI3PK = USER#<sellerId> AND begins_with(GSI3SK, "ORDER#")` | Query |
| **AP-17** | Update order status (Accepted, In-transit, Delivered) | Primary Table | `PK = ORDER#<orderId> AND SK = METADATA` | `UpdateItem` with state validation |
| **AP-18** | Fetch message history in a conversation | Primary Table | `PK = CONV#<convId> AND begins_with(SK, "MSG#")` | Query, limit 50, pagination |
| **AP-19** | Send message | Primary Table | `PK = CONV#<convId>, SK = MSG#<timestamp>#<msgId>` | `PutItem` |
| **AP-20** | Get unread notifications for a user | `GSI2` | `GSI2PK = USER#<userId> AND begins_with(GSI2SK, "STATUS#UNREAD#")` | Query |
| **AP-21** | Mark notification as read | Primary Table | `PK = USER#<userId> AND SK = NOTIF#<timestamp>#<id>` | `UpdateItem` |
| **AP-22** | Log AI query for audit & analytics | Primary Table | `PK = USER#<userId>, SK = AI_QUERY#<timestamp>#<id>` | `PutItem` |

---

## 2. GSI Summary & Partition Balancing

- **GSI1**: Focuses on **Public Catalog Discovery**. Partition keys combine category and status (`CATEGORY#BYPRODUCT#STATUS#ACTIVE`) to ensure queries immediately filter out inactive/sold-out items without scan penalty.
- **GSI2**: Focuses on **User Resource Aggregation** (`USER#<userId>`). Allows any user to quickly list their listings, orders, or unread alerts in chronological order using range expressions on the sort key.
- **GSI3**: Focuses on **Geographic & Cross-Entity Discovery** (`DISTRICT#<district>` or `USER#<sellerId>`). Allows rapid localization of heavy agricultural residues and machinery rentals within local proximity.
