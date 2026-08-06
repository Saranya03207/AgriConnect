# Lambda Deployment: listings

## Details
- **Lambda Name:** listings
- **Runtime:** Node.js 22.x
- **Handler:** functions/listings/handler.handler

## Environment Variables
- `S3_BUCKET_NAME`

## IAM Permissions
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Query`
- `dynamodb:Scan`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `s3:PutObject`
- `s3:GetObject`

## API Gateway Routes
- `GET /listings`
- `GET /listings/{listingId}`
- `POST /listings`
- `POST /listings/upload-urls`
- `PUT /listings/{listingId}`
- `DELETE /listings/{listingId}`
