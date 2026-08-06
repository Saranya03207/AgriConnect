# Lambda Deployment: admin

## Details
- **Lambda Name:** admin
- **Runtime:** Node.js 22.x
- **Handler:** functions/admin/handler.handler

## Environment Variables
- *None required*

## IAM Permissions
- `dynamodb:Scan`
- `dynamodb:Query`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `cognito-idp:AdminDisableUser`

## API Gateway Routes
- `GET /admin/users`
- `GET /admin/listings`
- `GET /admin/transactions`
- `PUT /admin/users/{userId}/status`
- `PUT /admin/listings/{listingId}/status`
