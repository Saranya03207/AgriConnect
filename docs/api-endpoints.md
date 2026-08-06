# AgriConnect – API Endpoints

Base URL: `https://api.agriconnect.io/v1`

Auth: All endpoints (except public browse) require `Authorization: Bearer <cognito_jwt>`

---

## Auth Module `/auth`

| Method | Endpoint               | Description                        | Roles      |
|--------|------------------------|------------------------------------|------------|
| POST   | /auth/register         | Register new user                  | Public     |
| POST   | /auth/login            | Login (handled by Cognito)         | Public     |
| POST   | /auth/refresh          | Refresh JWT token                  | Public     |
| POST   | /auth/forgot-password  | Trigger password reset             | Public     |
| POST   | /auth/confirm-password | Confirm new password               | Public     |
| POST   | /auth/verify-email     | Confirm email OTP                  | Public     |
| DELETE | /auth/logout           | Invalidate refresh token           | All        |

---

## Users Module `/users`

| Method | Endpoint               | Description                        | Roles         |
|--------|------------------------|------------------------------------|---------------|
| GET    | /users/me              | Get current user profile           | All           |
| PUT    | /users/me              | Update current user profile        | All           |
| POST   | /users/me/avatar       | Upload profile image               | All           |
| GET    | /users/:userId         | Get public profile of a user       | All           |
| GET    | /users/:userId/reviews | Get reviews for a user             | All           |
| GET    | /users/:userId/listings| Get listings by a user             | All           |
| GET    | /users                 | List all users (paginated)         | Admin         |
| PUT    | /users/:userId/status  | Suspend/activate user              | Admin         |
| PUT    | /users/:userId/verify  | Approve user verification          | Admin         |

---

## Listings Module `/listings`

| Method | Endpoint               | Description                        | Roles              |
|--------|------------------------|------------------------------------|--------------------|
| GET    | /listings              | Browse listings (public, filtered) | Public             |
| GET    | /listings/:listingId   | Get listing detail                 | Public             |
| POST   | /listings              | Create new listing                 | Farmer             |
| PUT    | /listings/:listingId   | Update listing                     | Farmer (owner)     |
| DELETE | /listings/:listingId   | Delete/archive listing             | Farmer (owner)     |
| POST   | /listings/:listingId/images | Upload listing images         | Farmer (owner)     |
| GET    | /listings/me           | Get my listings                    | Farmer             |
| GET    | /listings/featured     | Get featured/promoted listings     | Public             |
| POST   | /listings/:listingId/save | Save listing to favorites       | Buyer, Agribusiness|
| DELETE | /listings/:listingId/save | Remove from favorites           | Buyer, Agribusiness|
| GET    | /listings/saved        | Get saved listings                 | Buyer, Agribusiness|

---

## Demand Listings Module `/demands`

| Method | Endpoint               | Description                        | Roles              |
|--------|------------------------|------------------------------------|--------------------|
| GET    | /demands               | Browse demand listings             | All                |
| GET    | /demands/:demandId     | Get demand detail                  | All                |
| POST   | /demands               | Post a demand/need                 | Agribusiness       |
| PUT    | /demands/:demandId     | Update demand                      | Agribusiness (own) |
| DELETE | /demands/:demandId     | Remove demand                      | Agribusiness (own) |
| GET    | /demands/me            | My posted demands                  | Agribusiness       |

---

## Transactions Module `/transactions`

| Method | Endpoint                        | Description                    | Roles              |
|--------|---------------------------------|--------------------------------|--------------------|
| GET    | /transactions                   | Get my transactions            | All                |
| GET    | /transactions/:transactionId    | Get transaction detail         | Involved parties   |
| POST   | /transactions                   | Initiate a transaction/offer   | Buyer, Agribusiness|
| PUT    | /transactions/:transactionId    | Accept / counter-offer         | Farmer, Buyer      |
| POST   | /transactions/:transactionId/cancel | Cancel transaction         | Involved parties   |
| POST   | /transactions/:transactionId/dispute | Raise a dispute           | Involved parties   |
| GET    | /transactions/:transactionId/history | Get offer history          | Involved parties   |

---

## Messaging Module `/messages`

| Method | Endpoint                              | Description                  | Roles  |
|--------|---------------------------------------|------------------------------|--------|
| GET    | /messages/conversations               | List my conversations        | All    |
| GET    | /messages/conversations/:convId       | Get messages in conversation | All    |
| POST   | /messages/conversations               | Start a new conversation     | All    |
| POST   | /messages/conversations/:convId       | Send a message               | All    |
| PUT    | /messages/conversations/:convId/read  | Mark messages as read        | All    |

---

## Deliveries Module `/deliveries`

| Method | Endpoint                             | Description                   | Roles              |
|--------|--------------------------------------|-------------------------------|--------------------|
| GET    | /deliveries                          | Get my deliveries             | All                |
| GET    | /deliveries/:deliveryId              | Get delivery detail           | Involved parties   |
| POST   | /deliveries                          | Create delivery request       | Farmer, Admin      |
| PUT    | /deliveries/:deliveryId/status       | Update delivery status        | Logistics, Admin   |
| GET    | /deliveries/available                | View available jobs           | Logistics          |
| POST   | /deliveries/:deliveryId/accept       | Accept a delivery job         | Logistics          |
| GET    | /deliveries/:deliveryId/track        | Get real-time tracking        | All (involved)     |

---

## Reviews Module `/reviews`

| Method | Endpoint               | Description                        | Roles         |
|--------|------------------------|------------------------------------|---------------|
| POST   | /reviews               | Submit a review                    | Buyer, Farmer |
| GET    | /reviews/:userId       | Get reviews for a user             | Public        |

---

## AI Advisor Module `/ai`

| Method | Endpoint               | Description                        | Roles              |
|--------|------------------------|------------------------------------|--------------------|
| POST   | /ai/crop-advice        | Get AI crop management advice      | Farmer             |
| POST   | /ai/byproduct-ideas    | AI suggestions for by-product use  | Farmer, Agribusiness|
| POST   | /ai/market-insights    | AI market trend analysis           | All                |
| POST   | /ai/pricing-estimate   | AI price estimation for listing    | Farmer             |
| GET    | /ai/history            | Get my AI query history            | All                |

---

## Notifications Module `/notifications`

| Method | Endpoint                          | Description                   | Roles  |
|--------|-----------------------------------|-------------------------------|--------|
| GET    | /notifications                    | Get my notifications          | All    |
| PUT    | /notifications/:id/read           | Mark single as read           | All    |
| PUT    | /notifications/read-all           | Mark all as read              | All    |
| DELETE | /notifications/:id                | Delete notification           | All    |
| PUT    | /notifications/preferences        | Update notification prefs     | All    |

---

## Admin Module `/admin`

| Method | Endpoint                      | Description                       | Roles  |
|--------|-------------------------------|-----------------------------------|--------|
| GET    | /admin/dashboard              | Platform stats overview           | Admin  |
| GET    | /admin/users                  | All users with filters            | Admin  |
| GET    | /admin/listings               | All listings with moderation flag | Admin  |
| POST   | /admin/listings/:id/flag      | Flag a listing                    | Admin  |
| DELETE | /admin/listings/:id           | Remove a listing                  | Admin  |
| GET    | /admin/transactions           | All transactions                  | Admin  |
| GET    | /admin/reports                | Analytics reports                 | Admin  |
| POST   | /admin/broadcast              | Send broadcast notification       | Admin  |
| GET    | /admin/categories             | Manage listing categories         | Admin  |
| POST   | /admin/categories             | Create category                   | Admin  |

---

## Search Module `/search`

| Method | Endpoint               | Description                        | Roles  |
|--------|------------------------|------------------------------------|--------|
| GET    | /search                | Full-text search across listings   | Public |
| GET    | /search/suggestions    | Autocomplete suggestions           | Public |
| GET    | /search/nearby         | Location-based listing search      | Public |

---

## Webhook / Event Endpoints (Internal)
These are triggered by EventBridge rules, not by clients.

| Trigger                  | Lambda Function           | Description                        |
|--------------------------|---------------------------|------------------------------------|
| listing.created          | onListingCreated          | Notify matched buyers              |
| transaction.statusChanged| onTransactionUpdated      | Notify both parties                |
| delivery.statusChanged   | onDeliveryUpdated         | Send tracking notification         |
| user.registered          | onUserRegistered          | Send welcome email via SNS         |
