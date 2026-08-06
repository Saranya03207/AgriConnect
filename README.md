# AgriConnect

**AI-Powered Agricultural Resource and By-product Exchange Platform**

A cloud-native, serverless marketplace connecting farmers, buyers, agribusinesses, and logistics
providers — powered by Google Gemini AI and AWS.

---

## Project Structure

```
AgriConnect/
├── frontend/          React + Vite + TypeScript + Tailwind + Shadcn UI
├── backend/           AWS Lambda (Node.js) – standalone deployment
└── docs/              Architecture, schema, API, and roadmap documentation
```

---

## Documentation

| Document                              | Description                              |
|---------------------------------------|------------------------------------------|
| [Architecture](docs/architecture.md)  | System design and AWS service overview   |
| [User Roles](docs/user-roles.md)       | Role definitions and permission matrix   |
| [DynamoDB Schema](docs/dynamodb-schema.md) | Table design and access patterns    |
| [API Endpoints](docs/api-endpoints.md)| Full REST API reference                  |
| [Navigation Flow](docs/navigation-flow.md) | Route structure per role            |
| [AWS Services Map](docs/aws-services-map.md) | Module → AWS service mapping      |
| [Reusable Components](docs/reusable-components.md) | React component library plan |
| [Roadmap](docs/roadmap.md)            | Phase-by-phase development plan          |

---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI |
| Routing    | React Router v6                                     |
| HTTP       | Axios                                               |
| Backend    | AWS Lambda (Node.js 20.x)                           |
| API        | Amazon API Gateway (REST)                           |
| Database   | Amazon DynamoDB (single-table design)               |
| Storage    | Amazon S3                                           |
| Auth       | Amazon Cognito                                      |
| Events     | Amazon EventBridge                                  |
| Notify     | Amazon SNS                                          |
| Maps       | Amazon Location Service                             |
| AI         | Google Gemini API                                   |
| Hosting    | AWS Amplify                                         |
| Hosting/CD | AWS Amplify (CI/CD + CDN)                          |

---

## Getting Started

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # fill in your values
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env        # fill in your values
npm run build               # compiles TypeScript to dist/
# Deploy Lambda functions via AWS Console or CLI
# See docs/amplify-deployment-guide.md
```

### Deployment

Frontend is deployed automatically via AWS Amplify Hosting.
Push to `main` branch triggers CI/CD build and deployment.
See [Amplify Deployment Guide](docs/amplify-deployment-guide.md) for setup.

---

## Current Phase: 2 – Authentication & User Management

Phase 1 (Foundation) is complete. Phase 2 is in progress:
- Full architecture and documentation
- Frontend skeleton (all routes, contexts, types, services, hooks)
- Backend skeleton (Lambda handlers, shared lib)
- DynamoDB single-table schema with GSIs
- EventBridge event catalog
- AWS Amplify Hosting configuration

**Current:** Phase 2 – Authentication & User Management
