# AgriConnect – System Architecture

## Overview
AgriConnect is an AI-powered agricultural value-chain platform designed to connect agricultural stakeholders across production, residue management, value-added processing, logistics, and procurement.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|                   React + Vite Single Page Application (SPA)                     |
|               (JavaScript, Tailwind CSS, React Router, React Hook Form)           |
|                               Hosted on AWS Amplify                               |
+------------------------------------------+----------------------------------------+
                                           |
                    1. Authenticate        | 2. Bearer JWT Token
                           v               v
            +-----------------------------------------------+
            |            Amazon Cognito User Pool           |
            |     (User Authentication & JWT Issuance)      |
            +----------------------+------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------------------+
|                                 GATEWAY LAYER                                     |
|                                                                                   |
|                          Amazon API Gateway (HTTP API v2)                         |
|                    - Native JWT Authorizer (Cognito User Pool)                    |
|                    - CORS Configuration                                           |
|                    - Route Dispatching ($request.routeKey)                        |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                                COMPUTE LAYER                                      |
|                                                                                   |
|                             Python 3.12 AWS Lambda                                |
|        - Functions: Users, Listings, Search, Orders, Messages, Notifications,     |
|                     AI, Admin                                                     |
|        - Shared: Auth claims parsing, DynamoDB client, S3 client,                |
|                  Secrets Manager & OpenAI client abstraction                      |
+-------+--------------------+---------------------+--------------------+-----------+
        |                    |                     |                    |
        v                    v                     v                    v
+---------------+    +---------------+     +---------------+    +---------------+
|   DATA TIER   |    | STORAGE TIER  |     |  SECURITY     |    |   AI TIER     |
|               |    |               |     |               |    |               |
| Amazon        |    | Amazon S3     |     | AWS Secrets   |    | OpenAI API    |
| DynamoDB      |    | Private       |     | Manager       |    | (GPT-4o-mini/ |
| Single-Table: |    | Bucket        |     | (Encrypted    |    |  GPT-4o)      |
| AgriConnect-  |    | (Presigned    |     |  OpenAI API   |    |               |
| Main          |    |  Upload/Read) |     |  Key)         |    |               |
+---------------+    +---------------+     +---------------+    +---------------+
        ^                    ^                     ^                    ^
        +--------------------+----------+----------+--------------------+
                                        |
                                        v
                               +----------------+
                               |   MONITORING   |
                               | Amazon         |
                               | CloudWatch     |
                               | Logs & Metrics |
                               +----------------+
```

---

## 2. Core Architectural Principles

1. **Client Isolation from Sensitive Services**:
   - The React client **never** talks directly to the OpenAI API or DynamoDB.
   - The OpenAI API key is stored exclusively in AWS Secrets Manager and accessed only by Python Lambda backends.
   - S3 objects are private; uploads and downloads use short-lived presigned URLs.

2. **HTTP API v2 with Native Cognito Authorizer**:
   - Uses lightweight Amazon API Gateway HTTP API (Payload format v2.0).
   - JWT tokens issued by Cognito are validated directly at the Gateway before invoking Lambda functions.
   - Lambda receives pre-validated claims in `event['requestContext']['authorizer']['jwt']['claims']`.

3. **Backend Identity Enforcement**:
   - Never trust `userId` or role provided in the request payload or query parameters.
   - All state modifications and ownership validations check `claims['sub']` against the resource owner.

4. **Single-Table DynamoDB Architecture**:
   - Centralized database table: `AgriConnect-Main`.
   - All entities (Users, Listings, Orders, Messages, Notifications, Reviews) reside within the same table, indexed with GSIs for high-performance query access.

5. **AI Pipeline Separation**:
   - LLM handles intent parsing, entity extraction, and recommendation generation.
   - The database performs actual inventory queries; the LLM never fabricates listings.
