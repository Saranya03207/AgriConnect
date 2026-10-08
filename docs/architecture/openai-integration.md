# AgriConnect – OpenAI Integration Architecture

## 1. Architectural Philosophy
AgriConnect is **not** a simple generic chatbot. The AI system acts as an intelligent intermediary that transforms unstructured natural language into structured agricultural transactions and marketplace discovery.

### Security Boundary
```
[Browser / React Client]
       │
       │ (Cognito JWT Bearer)
       ▼
[Amazon API Gateway HTTP API]
       │
       ▼
[AWS Lambda (Python 3.12)] ───► [AWS Secrets Manager] (Fetches API Key)
       │
       ├───► [OpenAI API (GPT-4o-mini / GPT-4o)] (Backend-only)
       │
       └───► [DynamoDB: AgriConnect-Main] (Real database query)
```
- **Rule 1**: The client never connects to OpenAI directly.
- **Rule 2**: Secrets Manager stores the API key; keys are never hardcoded or logged.
- **Rule 3**: The LLM never hallucinates or fabricates inventory. Real items are always retrieved from DynamoDB.

---

## 2. Core AI Capabilities

### A. Intent Detection & Entity Extraction
When a user expresses a natural language need, the AI extracts structured search parameters.

**User Input Example**:
> *"I need 5 tonnes of coconut husk near Pollachi."*

**AI Extraction Output (JSON Schema Mode)**:
```json
{
  "intent": "find_byproduct",
  "category": "BYPRODUCT",
  "material": "coconut husk",
  "quantity": 5,
  "unit": "tonnes",
  "location": {
    "district": "Coimbatore",
    "place": "Pollachi",
    "state": "Tamil Nadu"
  },
  "max_distance_km": 50,
  "urgency": "standard"
}
```

### B. Marketplace Matching Pipeline
```
1. User Natural Language Query
          │
          ▼
2. Python Lambda (backend/functions/ai/handler.py)
          │
          ▼
3. OpenAI LLM (Entity & Intent Extraction)
   - Temperature: 0.1
   - Structured JSON Output
          │
          ▼
4. DynamoDB Query Execution (shared/dynamodb.py)
   - GSI1: Category + SubCategory query
   - Filter expressions: Location / District, Status = 'ACTIVE'
          │
          ▼
5. Candidate Inventory Retrieval
          │
          ▼
6. Re-ranking & Contextual Synthesis (OpenAI)
   - Matches candidate listings with user requirements
   - Formulates concise, professional summary with listing IDs
          │
          ▼
7. Response Delivery to Frontend with Verified Listing Cards
```

### C. AI Listing Assistant
Assists farmers and by-product sellers in creating high-quality listings from short voice-to-text or casual inputs:
- Generates clear agricultural descriptions
- Recommends standardized categories and subcategories
- Suggests realistic market pricing bands based on standard commodity baselines
- Suggests standard moisture content and packaging specs

### D. Agricultural Knowledge Assistant (RAG Pipeline)
- Answers queries regarding government subsidy schemes (PM-KUSUM, Soil Health Card, State agro-schemes).
- Researches crop disease management, organic inputs, and residue utilization.
- References verified institutional documents (stored in S3 with chunked embeddings).

---

## 3. Implementation Abstraction (`shared/openai_client.py`)

- **Connection Caching**: Reuses `OpenAI()` client instance across warm container invocations.
- **Secret Retrieval**: Pulls secret from AWS Secrets Manager (`AgriConnect/OpenAI`) once per cold start.
- **Resilience**: Configured timeouts (8s) and retries on transient network errors.
- **Model Fallbacks**: Default `gpt-4o-mini` for fast structured extractions, with configurable escalation to `gpt-4o` for complex RAG synthesis.
