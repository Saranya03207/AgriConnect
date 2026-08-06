# AgriConnect – AWS Services by Module

## Service Overview

| AWS Service              | Purpose in AgriConnect                                   |
|--------------------------|----------------------------------------------------------|
| AWS Amplify              | Frontend hosting, CI/CD, environment management          |
| Amazon Cognito           | Authentication, authorization, user pools, JWT tokens    |
| Amazon API Gateway       | REST API routing, JWT validation, throttling, CORS       |
| AWS Lambda (Node.js)     | All backend business logic (serverless functions)        |
| Amazon DynamoDB          | Primary data store (users, listings, transactions, etc.) |
| Amazon S3                | Image/document storage (listings, profiles, docs)        |
| Amazon SNS               | Email, SMS, and push notifications                       |
| Amazon EventBridge       | Async event bus for decoupled event-driven workflows     |
| Amazon Location Service  | Delivery routing, geocoding, map display                 |
| AWS SSM Parameter Store  | Secrets and config (API keys, feature flags)             |
| Amazon CloudWatch        | Lambda logs, metrics, alarms                             |
| AWS IAM                  | Role-based access control per Lambda function            |

---

## Module → AWS Service Mapping

### Auth Module
| Service          | Usage                                                    |
|------------------|----------------------------------------------------------|
| Amazon Cognito   | User Pool for registration, login, MFA, JWT issuance     |
| API Gateway      | Cognito Authorizer validates JWT on protected routes     |
| Lambda           | Post-confirmation trigger to create DynamoDB user record |
| DynamoDB         | Store extended user profile data                         |
| SNS              | Send verification email / SMS OTP                        |

---

### Listings Module
| Service    | Usage                                                         |
|------------|---------------------------------------------------------------|
| Lambda     | CRUD handlers for listings                                    |
| DynamoDB   | Store listing data with GSIs for category/region/seller query |
| S3         | Store listing images (presigned URLs for direct upload)       |
| EventBridge| Publish `listing.created` event to notify matched buyers      |

---

### Marketplace / Search Module
| Service                | Usage                                               |
|------------------------|-----------------------------------------------------|
| Lambda                 | Search and filter listings                          |
| DynamoDB               | Query with GSIs (category, region, status)          |
| Amazon Location Service| Nearby search using geo-coordinates                 |

---

### Transactions Module
| Service      | Usage                                                     |
|--------------|-----------------------------------------------------------|
| Lambda       | Offer, accept, reject, counter-offer logic                |
| DynamoDB     | Store transaction records and offer history               |
| EventBridge  | Publish `transaction.statusChanged` events                |
| SNS          | Notify both parties of transaction updates                |

---

### Messaging Module
| Service    | Usage                                                         |
|------------|---------------------------------------------------------------|
| Lambda     | Send/receive messages, conversation management                |
| DynamoDB   | Store conversations and messages (sorted by timestamp)        |
| SNS        | Push notification when new message received                   |

---

### Deliveries Module
| Service                | Usage                                               |
|------------------------|-----------------------------------------------------|
| Lambda                 | Delivery creation, status updates, job assignment   |
| DynamoDB               | Store delivery records and tracking events          |
| Amazon Location Service| Route calculation, geocoding, real-time tracker     |
| EventBridge            | Publish `delivery.statusChanged` event              |
| SNS                    | SMS/push notifications for delivery milestones      |

---

### AI Advisor Module
| Service           | Usage                                                  |
|-------------------|--------------------------------------------------------|
| Lambda            | Call Google Gemini API, structure prompts/responses    |
| DynamoDB          | Store AI query history per user                        |
| SSM Parameter Store| Store Gemini API key securely                         |
| EventBridge       | Async AI queries (fire-and-forget for heavy analysis)  |

---

### Notifications Module
| Service      | Usage                                                     |
|--------------|-----------------------------------------------------------|
| Lambda       | Notification management CRUD                              |
| DynamoDB     | Store notification records per user                       |
| SNS          | Deliver email, SMS, and push notifications                |
| EventBridge  | Receive events from other modules and trigger Lambda      |

---

### Admin Module
| Service        | Usage                                                   |
|----------------|---------------------------------------------------------|
| Lambda         | Admin CRUD operations across all entities               |
| DynamoDB       | Platform-wide queries via admin GSI patterns            |
| CloudWatch     | Metrics and logs dashboard integration                  |
| SNS            | Broadcast notification delivery                         |

---

### Profile / User Module
| Service    | Usage                                                         |
|------------|---------------------------------------------------------------|
| Lambda     | Profile read/update handlers                                  |
| DynamoDB   | User entity storage and retrieval                             |
| S3         | Profile image storage (presigned upload URLs)                 |
| Cognito    | Sync email/phone changes with Cognito User Pool               |

---

## S3 Bucket Structure

```
agriconnect-media-<env>/
├── profiles/
│   └── <userId>/avatar.<ext>
├── listings/
│   └── <listingId>/<imageIndex>.<ext>
├── verification-docs/
│   └── <userId>/<docType>.<ext>
└── exports/
    └── reports/<date>/<reportName>.csv
```

Bucket policies:
- `profiles/` → Public read (profile images)
- `listings/` → Public read (listing images)
- `verification-docs/` → Private (admin access only)
- `exports/` → Private (admin access only)

---

## EventBridge Event Catalog

| Event Name                     | Source            | Consumer Lambda           |
|-------------------------------|-------------------|---------------------------|
| agriconnect.listing.created    | listings-service  | notifications-dispatcher  |
| agriconnect.transaction.updated| transactions-svc  | notifications-dispatcher  |
| agriconnect.delivery.updated   | deliveries-svc    | notifications-dispatcher  |
| agriconnect.user.registered    | auth-service      | welcome-email-sender      |
| agriconnect.ai.query.requested | ai-service        | ai-processor              |
