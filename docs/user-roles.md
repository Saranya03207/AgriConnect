# AgriConnect – User Roles

## Role Definitions

### 1. Farmer
**Description:** Primary producers who list agricultural resources, surplus crops, and by-products.

**Permissions:**
- Create, update, delete their own listings
- Respond to buyer inquiries and offers
- View and accept/reject transaction requests
- Access AI Advisor for crop and resource management tips
- Track outgoing deliveries via logistics module
- Manage their farm profile and verification documents
- Receive notifications for offers, messages, and price alerts

---

### 2. Buyer
**Description:** Individuals or businesses looking to purchase agricultural resources or by-products.

**Permissions:**
- Browse and search all active listings
- Submit offers and negotiate pricing
- Initiate and manage transactions
- Track incoming deliveries
- Rate and review sellers after completed transactions
- Access AI Advisor for sourcing and market insights
- Save favorite listings and sellers

---

### 3. Agribusiness
**Description:** Companies (processors, co-ops, exporters) needing bulk supply or waste exchange partnerships.

**Permissions:**
- All Buyer permissions
- Post bulk demand listings (reverse marketplace)
- Access analytics dashboard for supply forecasting
- Manage multiple team member sub-accounts
- Integration-ready API access (for ERP systems)
- Priority AI Advisor access for market trend analysis

---

### 4. Logistics Provider
**Description:** Transport and delivery partners who fulfill delivery requests on the platform.

**Permissions:**
- View and accept delivery assignments
- Update shipment status in real-time
- Manage vehicle/fleet profile
- Receive route guidance via Amazon Location Service
- View earnings and completed delivery history

---

### 5. Admin
**Description:** Platform operators responsible for content moderation and system health.

**Permissions:**
- Full read/write access to all platform data
- Approve/reject user verification requests
- Moderate listings and flag inappropriate content
- Manage categories, tags, and platform configuration
- View platform-wide analytics and reports
- Send broadcast notifications
- Manage user accounts (suspend, ban, restore)

---

## Role Matrix

| Feature                  | Farmer | Buyer | Agribusiness | Logistics | Admin |
|--------------------------|--------|-------|--------------|-----------|-------|
| Create Listings          | ✅     | ❌    | ❌           | ❌        | ✅    |
| Post Demand Listings     | ❌     | ❌    | ✅           | ❌        | ✅    |
| Browse Marketplace       | ✅     | ✅    | ✅           | ❌        | ✅    |
| Submit Offers            | ❌     | ✅    | ✅           | ❌        | ❌    |
| Manage Deliveries        | ✅     | ✅    | ✅           | ✅        | ✅    |
| Accept Deliveries        | ❌     | ❌    | ❌           | ✅        | ❌    |
| AI Advisor Access        | ✅     | ✅    | ✅           | ❌        | ✅    |
| Analytics Dashboard      | ❌     | ❌    | ✅           | ❌        | ✅    |
| User Moderation          | ❌     | ❌    | ❌           | ❌        | ✅    |
| Platform Configuration   | ❌     | ❌    | ❌           | ❌        | ✅    |

---

## Cognito Groups

```
agriconnect-farmers
agriconnect-buyers
agriconnect-agribusinesses
agriconnect-logistics
agriconnect-admins
```

Each group maps to a Cognito User Pool Group. Role is embedded in the JWT token as a custom claim
`custom:role` and enforced at both API Gateway (authorizer) and Lambda (business logic) levels.
