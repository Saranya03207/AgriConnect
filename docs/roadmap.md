# AgriConnect – Development Roadmap

## Phase 1 – Project Foundation (Current)
**Goal:** Establish architecture, folder structure, configuration, and skeleton.

- [x] Full architecture and documentation update
- [x] Frontend skeleton (all routes, contexts, types, services, hooks)
- [x] AWS Amplify Hosting configuration
- [x] Authentication pages (Login, Register, Forgot Password, Verify Email)
- [x] Cognito Integration & Role-based routing
- [x] Backend project scaffold (Lambda functions structure)
- [x] Shared types and constants
- [x] Environment configuration files

---

## Phase 2 – Authentication & User Management
**Goal:** Full auth flow with role-based access.

- [ ] Cognito User Pool setup (AWS Console/CLI)
- [ ] Register page (role selection, form validation)
- [ ] Login page (email/password)
- [ ] Forgot/reset password flow
- [ ] Email verification flow
- [ ] JWT decode + role extraction
- [ ] Protected route guards in React Router
- [ ] Post-confirmation Lambda trigger (create DynamoDB user record)
- [ ] User profile page (view + edit)
- [ ] Profile image upload (S3 presigned URL)
- [ ] Cognito groups per role

---

## Phase 3 – Listings & Marketplace
**Goal:** Core marketplace browse and listing creation.

- [ ] Listing creation form (farmers)
- [ ] Multi-image upload to S3
- [ ] Listing detail page
- [ ] Browse/marketplace page with filters
- [ ] Category and region filter
- [ ] Search functionality
- [ ] Nearby listings (Amazon Location Service)
- [ ] Save/favourite listings (buyers)
- [ ] My listings management page (farmer)
- [ ] Demand listings (agribusiness)

---

## Phase 4 – Transactions & Offers
**Goal:** Enable negotiation and deal-closing between users.

- [ ] Submit offer UI and Lambda handler
- [ ] Accept / reject / counter-offer flow
- [ ] Offer history timeline
- [ ] Transaction status management
- [ ] Dispute raising flow
- [ ] Transaction detail page
- [ ] Seller/buyer transaction list pages

---

## Phase 5 – Messaging
**Goal:** In-platform communication between users.

- [ ] Conversation list UI
- [ ] Chat thread UI
- [ ] Send message Lambda handler
- [ ] DynamoDB message storage
- [ ] New message SNS notification
- [ ] Mark as read functionality
- [ ] Link conversation to listing/transaction

---

## Phase 6 – Deliveries & Logistics
**Goal:** Logistics assignment, tracking, and route display.

- [ ] Delivery request creation
- [ ] Available jobs view (logistics providers)
- [ ] Accept delivery job
- [ ] Status update flow (picked up → in transit → delivered)
- [ ] Live tracking map (Amazon Location Service)
- [ ] Route display on map
- [ ] Delivery timeline/history
- [ ] SMS/push delivery status notifications (SNS)

---

## Phase 7 – AI Advisor
**Goal:** Gemini-powered insights for farmers and buyers.

- [ ] AI Advisor UI shell
- [ ] Crop advice query form + Gemini integration
- [ ] By-product suggestions module
- [ ] Market insights module
- [ ] AI pricing estimator for listings
- [ ] Query history page
- [ ] Async AI query via EventBridge (for heavy analysis)
- [ ] Rate limiting per user

---

## Phase 8 – Notifications
**Goal:** Full notification system across all events.

- [ ] Notification center UI
- [ ] Mark read / delete notifications
- [ ] SNS email notifications
- [ ] SNS SMS notifications
- [ ] EventBridge → Lambda → DynamoDB notification pipeline
- [ ] Notification preferences settings
- [ ] Unread badge in navigation

---

## Phase 9 – Reviews & Ratings
**Goal:** Trust layer via peer reviews.

- [ ] Submit review after completed transaction
- [ ] Star rating component
- [ ] Review list on user profile
- [ ] Average rating calculation and display
- [ ] Review moderation (admin)

---

## Phase 10 – Admin Dashboard
**Goal:** Full platform management capabilities.

- [ ] Admin dashboard overview (stats cards)
- [ ] User management table (filter, search, suspend)
- [ ] Listing moderation (flag, remove)
- [ ] Transaction overview table
- [ ] Analytics reports (charts)
- [ ] Category management CRUD
- [ ] Broadcast notification sender

---

## Phase 11 – Analytics & Agribusiness Dashboard
**Goal:** Data insights for agribusiness users.

- [ ] Supply trend charts
- [ ] Price history graphs
- [ ] Demand vs supply heatmap
- [ ] AgriConnect-Analytics DynamoDB integration
- [ ] Export to CSV

---

## Phase 12 – Production Hardening
**Goal:** Performance, security, and reliability for go-live.

- [ ] Lambda cold-start optimization (provisioned concurrency)
- [ ] API Gateway usage plans and throttling
- [ ] S3 image CDN via CloudFront
- [ ] DynamoDB auto-scaling
- [ ] CloudWatch alarms for error rates
- [ ] WAF on API Gateway
- [ ] Security audit (IAM, bucket policies, Cognito config)
- [ ] End-to-end testing
- [ ] Load testing
- [x] CI/CD pipeline via AWS Amplify Hosting (configured in Phase 2)

---

## Timeline Estimate

| Phase | Scope                        | Estimated Duration |
|-------|------------------------------|--------------------|
| 1     | Foundation                   | Week 1             |
| 2     | Auth & Users                 | Week 2–3           |
| 3     | Listings & Marketplace       | Week 4–5           |
| 4     | Transactions & Offers        | Week 6             |
| 5     | Messaging                    | Week 7             |
| 6     | Deliveries & Logistics       | Week 8–9           |
| 7     | AI Advisor                   | Week 10            |
| 8     | Notifications                | Week 11            |
| 9     | Reviews & Ratings            | Week 12            |
| 10    | Admin Dashboard              | Week 13–14         |
| 11    | Analytics                    | Week 15            |
| 12    | Production Hardening         | Week 16–18         |
