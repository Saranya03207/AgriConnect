# AgriConnect – Roles and Capability Matrix

AgriConnect centers around **six primary business personas** participating in the agricultural value chain, plus a distinct privileged **ADMIN** role.

---

## 1. Persona Matrix

| Role Key | Role Name | Primary Business Activities | Key Listings / Entities Created |
| :--- | :--- | :--- | :--- |
| `SEED_PRODUCER` | Seed Producer / Nursery | Produces and sells certified seeds, saplings, high-yield varieties, and tissue-culture plants. | Seed listings, variety certifications, batch availability. |
| `FARMER` | Farmer / Crop Producer | Cultivates crops; procures seeds and services; lists harvested produce; sells secondary crop residue. | Crop produce listings, service requests, purchase orders for seeds/services. |
| `BYPRODUCT_SELLER` | By-product Seller | Collects and supplies farm biomass and residues (coconut husk, paddy straw, bagasse, stalks, shells). | By-product listings, recurring residue supply agreements. |
| `BUYER` | Buyer / Procurement | Procures agricultural produce, bulk crops, seeds, or inputs for wholesale, retail, or export. | Purchase requirements, RFQs, purchase orders, bids. |
| `SERVICE_PROVIDER` | Service Provider | Supplies tractor/harvester rental, seasonal farm labour, transport/logistics, and cold storage. | Service listings (Machinery, Labour, Transport, Storage), booking availability. |
| `PROCESSOR` | Processor / Agro-Industry | Operates oil extraction, coir units, sugar mills, bio-energy, food processing, or textile facilities. | Processing service offerings, industrial biomass buy requests, supply contracts. |
| `ADMIN` | System Administrator | Platform governance, verification, user moderation, dispute resolution, audit logs. | Platform configuration, category management, system metrics. |

---

## 2. Granular Capability Matrix

| Capability / Resource | SEED_PRODUCER | FARMER | BYPRODUCT_SELLER | BUYER | SERVICE_PROVIDER | PROCESSOR | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Own Profile** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Create Seed Listing** | Yes | No | No | No | No | No | Yes |
| **Create Crop Listing** | No | Yes | No | No | No | No | Yes |
| **Create By-product Listing** | No | Yes | Yes | No | No | Yes | Yes |
| **Create Service Listing (Labour/Machinery/Transport/Storage)** | No | No | No | No | Yes | Yes (Processing) | Yes |
| **Post Purchase Request / RFQ** | Yes (Inputs) | Yes (Inputs/Services) | No | Yes | No | Yes (Biomass/Produce) | Yes |
| **Browse Marketplace** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **AI Listing Assistant** | Yes | Yes | Yes | No | Yes | Yes | Yes |
| **AI Natural Language Search** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Initiate Order / Transaction** | Buyer/Seller | Buyer/Seller | Seller | Buyer | Provider | Buyer/Provider | Full Audit |
| **Direct Messaging** | Yes | Yes | Yes | Yes | Yes | Yes | Read/Moderate |
| **Upload Product Certificates** | Yes | Yes | Yes | Optional | Yes | Yes | Full Audit |
| **Moderate Users & Listings** | No | No | No | No | No | No | Yes |
| **View System Analytics** | No | No | No | No | No | No | Yes |

---

## 3. Role-Aware UX Design

AgriConnect uses a single unified frontend application with role-aware navigational paths:
1. **Dynamic Navigation**: Sidebar navigation updates based on the authenticated user's role claim.
2. **Contextual Action Buttons**: Fast-action buttons tailored to current persona (e.g., "Add Seed Batch" for Seed Producer vs "Post Requirement" for Buyer vs "Book Harvester" for Farmer).
3. **Tailored Metrics & Dashboards**:
   - **Farmer**: Harvest countdown, active produce listings, pending service bookings.
   - **By-product Seller**: Available biomass tonnage, proximity to industrial processors, buyer inquiries.
   - **Processor**: Biomass intake pipeline, processing capacity utilization, procurement fulfillment.
   - **Admin**: System health, unverified accounts, flagged listings, dispute tickets.
