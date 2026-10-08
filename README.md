# AgriConnect

**AI-Powered Agricultural Value-Chain & By-product Exchange Platform**

AgriConnect is a cloud-native, serverless platform connecting:
1. **Seed Producers**
2. **Farmers / Crop Producers**
3. **By-product Sellers**
4. **Buyers / Procurement**
5. **Service Providers** (Labour, Machinery, Transport, Cold Storage)
6. **Processors / Agro-Industries**
*(with a distinct privileged **Admin** role)*

---

## Architecture Overview

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS, React Router, React Hook Form, Zod
- **Backend**: Python 3.12, AWS Lambda, boto3
- **API**: Amazon API Gateway (HTTP API v2) with Amazon Cognito JWT Authorizer
- **Database**: Amazon DynamoDB (`AgriConnect-Main` single-table design)
- **Storage**: Amazon S3 (Private bucket with presigned upload/download URLs)
- **AI Intelligence**: OpenAI API (GPT-4o-mini / GPT-4o) accessed strictly via Python backend with AWS Secrets Manager
- **Hosting**: AWS Amplify
- **Monitoring**: Amazon CloudWatch

---

## Project Structure

```
agriconnect/
├── frontend/                     # React + Vite frontend application
│   ├── src/
│   │   ├── components/           # UI and domain components
│   │   ├── pages/                # Role-aware dashboards & public views
│   │   ├── layouts/              # Public, Protected, and Admin layouts
│   │   ├── services/             # API and Cognito integration services
│   │   ├── hooks/                # Custom React hooks
│   │   ├── context/              # Authentication & state contexts
│   │   ├── utils/                # Utilities and formatters
│   │   └── routes/               # Route configurations and guards
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Python AWS Lambda backend
│   ├── shared/                   # Shared backend utilities
│   │   ├── auth.py               # JWT parsing and role verification
│   │   ├── response.py           # Standard HTTP API response utilities & CORS
│   │   ├── dynamodb.py           # DynamoDB boto3 resource wrapper
│   │   ├── s3.py                 # S3 presigned URL generator
│   │   ├── validation.py         # Request validation utilities
│   │   ├── logging.py            # Structured JSON logger
│   │   └── openai_client.py      # OpenAI backend client with Secrets Manager
│   │
│   ├── functions/                # Lambda function handlers
│   │   ├── users/                # User profiles and onboarding
│   │   ├── listings/             # Agricultural and by-product listings
│   │   ├── search/               # Search and filtering
│   │   ├── orders/               # Purchase orders and procurement
│   │   ├── messages/             # Direct messaging
│   │   ├── notifications/        # In-app alerts
│   │   ├── ai/                   # OpenAI assistant & intent extraction
│   │   └── admin/                # System administration & moderation
│   │
│   └── requirements.txt
│
├── docs/                         # System documentation
│   ├── architecture/             # Architecture, roles, OpenAI & security specs
│   ├── api/                      # HTTP API v2 routes & JWT lifecycle
│   └── database/                 # Single-table schema & access patterns
│
├── .gitignore
└── README.md
```

---

## Documentation

- [System Architecture](docs/architecture/system-architecture.md)
- [Roles & Capability Matrix](docs/architecture/roles-and-capabilities.md)
- [OpenAI Integration Architecture](docs/architecture/openai-integration.md)
- [Security Architecture](docs/architecture/security-architecture.md)
- [DynamoDB Single-Table Design](docs/database/dynamodb-single-table-design.md)
- [DynamoDB Access Patterns](docs/database/access-patterns.md)
- [HTTP API Specification](docs/api/http-api-specification.md)
- [JWT Authentication Flow](docs/api/jwt-auth-flow.md)
