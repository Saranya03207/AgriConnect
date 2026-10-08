# AgriConnect – Security Architecture & Compliance

## 1. Authentication & Authorization Flow

```
[Client] ──(1. Login)──► [Cognito User Pool]
   │                          │
   │◄──(2. Returns JWTs)──────┘
   │
   ├──(3. HTTP Request with Bearer ID/Access Token)──► [API Gateway HTTP API]
                                                              │
                                     (4. Gateway validates signature, iss, exp)
                                                              │
                                                              ▼
                                                   [Python AWS Lambda]
                                               (5. Reads claims from context)
                                               (6. Validates resource ownership)
```

### Identity Derivation
- The backend **never** relies on `userId`, `authorId`, or `ownerId` sent in the request body or query string.
- All ownership checks strictly extract the subject ID from `event['requestContext']['authorizer']['jwt']['claims']['sub']`.

### Role-Based Access Control (RBAC)
- User role is captured in the custom Cognito attribute: `custom:role`.
- In Lambda, `shared.auth.has_role(user, allowed_roles)` validates that the caller has sufficient permissions.
- The `ADMIN` role is treated as a distinct privileged identity with audit-level permissions.

---

## 2. Storage Security (Amazon S3)

- **Strictly Private Bucket**:
  - `BlockPublicAcls = true`
  - `IgnorePublicAcls = true`
  - `BlockPublicPolicy = true`
  - `RestrictPublicBuckets = true`
- **Presigned Upload URLs**:
  - The client requests a presigned `PUT` URL specifying file path and MIME type.
  - URL is strictly valid for **15–60 minutes**.
- **Presigned Download URLs**:
  - To view attachments, private certificates, or listings images, the backend generates a short-lived presigned `GET` URL.
  - Direct public S3 bucket URLs (`https://bucket.s3.amazonaws.com/...`) are prohibited.

---

## 3. Secret Management (AWS Secrets Manager)

- **OpenAI Key Storage**:
  - Stored in AWS Secrets Manager under secret ID `AgriConnect/OpenAI`.
  - KMS encryption at rest using AWS managed key or customer managed KMS key.
  - Lambda execution role has strictly scoped permission: `secretsmanager:GetSecretValue` on the specific secret ARN.
- **Redaction & Safe Logging**:
  - Custom JSON log formatter ensures secrets and authorization tokens are masked.
  - CloudWatch logs never print raw event authorization headers or secret payloads.

---

## 4. Lambda Least-Privilege IAM Execution Policies

Lambda functions use distinct execution roles or a tightly scoped policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/AgriConnect-Main",
        "arn:aws:dynamodb:us-east-1:*:table/AgriConnect-Main/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::agriconnect-*/*"
    },
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:AgriConnect/OpenAI*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## 5. Network & Cross-Origin Resource Sharing (CORS)

- HTTP API handles CORS pre-flight (`OPTIONS`) requests at the API Gateway layer.
- Allowed Origins: Configurable via environment variable (`CORS_ORIGIN`), locked to the AWS Amplify application domain in staging and production.
- Allowed Headers: `Content-Type`, `Authorization`.
- Allowed Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
