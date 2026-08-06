# AgriConnect – System Architecture

## Overview

AgriConnect is a cloud-native, serverless platform that connects farmers, buyers, agribusinesses,
and logistics providers to exchange agricultural resources and by-products powered by AI insights.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│   React + Vite + TypeScript + Tailwind CSS + Shadcn UI              │
│   Hosted on AWS Amplify (CDN-backed, global distribution)           │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTPS / REST
┌────────────────────────▼────────────────────────────────────────────┐
│                      API GATEWAY LAYER                              │
│   Amazon API Gateway (REST API)                                     │
│   - JWT Authorizer (Cognito)                                        │
│   - Rate Limiting / Throttling                                      │
│   - CORS Configuration                                              │
│   - Request/Response Mapping                                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │ Invoke
┌────────────────────────▼────────────────────────────────────────────┐
│                      COMPUTE LAYER                                  │
│   AWS Lambda (Node.js 20.x)                                         │
│   - Modular function-per-route pattern                              │
│   - Shared /lib layer for utilities                                 │
│   - Environment variables via SSM Parameter Store                  │
└──────┬────────┬────────┬────────┬───────────┬────────────┬──────────┘
       │        │        │        │           │            │
┌──────▼──┐ ┌──▼────┐ ┌─▼─────┐ ┌▼────────┐ ┌▼─────────┐ ┌▼─────────┐
│DynamoDB │ │  S3   │ │Cognito│ │   SNS   │ │EventBridge│ │ Location │
│         │ │       │ │       │ │         │ │           │ │ Service  │
└─────────┘ └───────┘ └───────┘ └─────────┘ └───────────┘ └──────────┘
                                                    │
                                          ┌─────────▼──────────┐
                                          │   Google Gemini API │
                                          │   (AI Insights)     │
                                          └────────────────────┘
```

---

## Architecture Principles

| Principle         | Implementation                                      |
|-------------------|-----------------------------------------------------|
| Serverless-first  | All compute via AWS Lambda, no servers to manage    |
| Event-driven      | EventBridge for async workflows (notifications, AI) |
| Single-table      | DynamoDB single-table design with GSIs              |
| Least privilege   | IAM roles per Lambda function                       |
| Immutable infra   | AWS Amplify Hosting for frontend CI/CD; backend via AWS Console/CLI |
| Secure by default | Cognito auth, HTTPS everywhere, S3 bucket policies  |

---

## Module Overview

| Module              | Description                                              |
|---------------------|----------------------------------------------------------|
| Auth                | User registration, login, roles via Cognito              |
| Listings            | Post/browse agricultural resources and by-products       |
| Marketplace         | Search, filter, and request listings                     |
| Messaging           | Real-time chat between users (SNS + polling)             |
| Transactions        | Offer, negotiate, and close deals                        |
| AI Advisor          | Gemini-powered crop advice and by-product suggestions    |
| Logistics           | Delivery tracking via Amazon Location Service            |
| Notifications       | Push/email/SMS alerts via SNS                            |
| Admin               | Platform management, user moderation, analytics          |
| Profile             | User profiles, ratings, farm details                     |
