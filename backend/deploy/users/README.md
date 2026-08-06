# Lambda Deployment: users

## Details
- **Lambda Name:** users
- **Runtime:** Node.js 22.x
- **Handler:** functions/users/handler.handler

## Environment Variables
- `COGNITO_USER_POOL_ID`

## IAM Permissions
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Query`
- `dynamodb:Scan`
- `dynamodb:UpdateItem`
- `cognito-idp:AdminGetUser`
- `cognito-idp:AdminCreateUser`
- `cognito-idp:AdminDeleteUser`
- `cognito-idp:AdminUpdateUserAttributes`
- `cognito-idp:AdminDisableUser`

## API Gateway Routes
- `GET /users`
- `GET /users/{userId}`
- `POST /users`
- `PUT /users/{userId}`
- `DELETE /users/{userId}`
