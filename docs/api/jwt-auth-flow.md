# AgriConnect – JWT Authentication & Token Lifecycle Flow

## 1. Authentication Architecture

AgriConnect uses Amazon Cognito User Pools for authentication and identity management.

```
+----------------+                +-------------------------+               +-----------------------+
| React Frontend |                | Cognito User Pool       |               | API Gateway HTTP API  |
+-------+--------+                +------------+------------+               +-----------+-----------+
        |                                      |                                        |
        | 1. Sign In (email + password)        |                                        |
        |------------------------------------->|                                        |
        |                                      |                                        |
        | 2. Tokens (IdToken, AccessToken)     |                                        |
        |<-------------------------------------|                                        |
        |                                                                               |
        | 3. HTTP Request with Header: Authorization: Bearer <IdToken>                  |
        |------------------------------------------------------------------------------>|
        |                                                                               | 4. Validates JWT Signature,
        |                                                                               |    Expiry, and Issuer
        |                                                                               |
        |                                                                               | 5. Invokes Lambda with:
        |                                                                               |    claims in requestContext
        |                                                                               v
        |                                                                   +-----------------------+
        |                                                                   | Python Lambda Handler |
        |                                                                   +-----------------------+
```

---

## 2. Cognito User Attributes Schema

When users register in AgriConnect, the following attributes are populated:
- `sub` (Standard Cognito Unique Identifier): Becomes the system `userId`.
- `email` (Standard Attribute): Verified via 6-digit confirmation code.
- `custom:role` (Custom String Attribute): One of `SEED_PRODUCER`, `FARMER`, `BYPRODUCT_SELLER`, `BUYER`, `SERVICE_PROVIDER`, `PROCESSOR`, `ADMIN`.
- `custom:display_name` (Custom String Attribute): User full name or business entity name.

---

## 3. JWT Token Claims in Lambda (HTTP API v2 Payload Format)

Inside Python Lambda functions, API Gateway populates `event['requestContext']['authorizer']['jwt']['claims']`:

```json
{
  "requestContext": {
    "authorizer": {
      "jwt": {
        "claims": {
          "sub": "2a9a85c0-1011-709b-a3d8-55268c850239",
          "email": "farmer.ramesh@agriconnect.in",
          "email_verified": "true",
          "custom:role": "FARMER",
          "custom:display_name": "Ramesh Organic Farms",
          "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_QwDs99wc0",
          "exp": 1727712345
        },
        "scopes": null
      }
    }
  }
}
```

---

## 4. Frontend Integration Guidelines

- The frontend uses `amazon-cognito-identity-js` (or Amplify Auth) to manage user sessions.
- Tokens are retrieved via `CognitoUserSession.getIdToken().getJwtToken()`.
- HTTP calls automatically inject the authorization header:
  ```javascript
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
  ```
- Expired tokens are refreshed silently using the Cognito Refresh Token without forcing user re-login.
