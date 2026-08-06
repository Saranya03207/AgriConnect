# AWS Amplify Deployment Guide

This guide explains how to deploy the AgriConnect application using AWS Amplify Hosting for the frontend and AWS Console/CLI for the backend resources.

## Part 1 - Amplify Hosting Setup

Follow these steps to set up continuous deployment for the frontend:

1. Push your code to GitHub.
2. Open the **Amplify Console**, click **Host web app**, and connect your **GitHub** account.
3. Select the repository and the `main` branch.
4. Amplify will auto-detect the `amplify.yml` build specification in the root directory.
5. Configure the following environment variables in the Amplify Console:
   - `VITE_API_BASE_URL`
   - `VITE_COGNITO_USER_POOL_ID`
   - `VITE_COGNITO_CLIENT_ID`
   - `VITE_COGNITO_REGION`
   - `VITE_S3_BUCKET`
   - `VITE_S3_REGION`
6. Configure the SPA rewrite rule for React Router:
   - **Source:** `</^[^.]+$|\.(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$>`
   - **Target:** `/index.html`
   - **Type:** `200 (Rewrite)`
7. Click **Deploy**.
8. (Optional) Set up a custom domain in the Domain management section.

---

## Part 2 - Backend Resources Setup (AWS Console/CLI)

Backend resources are provisioned manually via AWS Console or CLI.

1. **Cognito User Pool:**
   - Sign-in options: Email.
   - Custom attributes: `custom:role`, `custom:display_name`.
   - Password policy: Set according to security requirements.
   - Add a PostConfirmation Lambda trigger to sync users to DynamoDB.

2. **Cognito App Client:**
   - Enable SRP auth.
   - Do NOT generate a client secret.
   - Token expiration: 1h for access/id tokens, 30d for refresh tokens.

3. **DynamoDB Tables:**
   - Table 1: `AgriConnect-Main` (Partition Key: `PK`, Sort Key: `SK`). Add GSI1, GSI2, and GSI3.
   - Table 2: `AgriConnect-Analytics`.
   - Set billing mode to **On-demand**.

4. **S3 Bucket:**
   - Create a bucket for user uploads.
   - Configure CORS to allow GET, PUT, POST, DELETE from your frontend domain.

5. **API Gateway (REST API):**
   - Create a REST API.
   - Configure a Cognito Authorizer.
   - Create resources and methods with Lambda proxy integration.
   - Enable CORS on all resources.

6. **Lambda Functions:**
   - Build functions from `backend/dist/`.
   - Create IAM roles for each function with minimum required permissions (e.g., DynamoDB access, S3 access).
   - Attach environment variables as needed.

7. **SNS Topic:**
   - Create topics for notifications.

8. **EventBridge:**
   - Create a custom event bus for application events.

9. **SSM Parameter Store:**
   - Store sensitive configuration like the Gemini API key.

---

## Part 3 - CI/CD Workflow Explanation

With this setup, the frontend has a fully automated CI/CD pipeline via AWS Amplify Hosting. Every push to the `main` branch triggers a new build. The build uses the configuration specified in `amplify.yml`, caching `node_modules` and outputting the final assets to the `dist` directory, which is then served via AWS's global CDN.

Backend updates require manual deployment or scripting via AWS CLI. This hybrid approach allows rapid frontend iteration while keeping backend infrastructure management explicit and controlled.

---

## Part 4 - Environment Variables Reference

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | The API Gateway endpoint URL |
| `VITE_COGNITO_USER_POOL_ID` | The Cognito User Pool ID |
| `VITE_COGNITO_CLIENT_ID` | The Cognito App Client ID |
| `VITE_COGNITO_REGION` | The AWS region where Cognito is deployed |
| `VITE_S3_BUCKET` | The name of the S3 bucket for uploads |
| `VITE_S3_REGION` | The AWS region where S3 is deployed |
