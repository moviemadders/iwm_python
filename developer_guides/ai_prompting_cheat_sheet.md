# 🤖 AI Prompting Cheat Sheet: The "Vibe Coder" Way

Use these templates to get the best results from your AI assistant.

---

## 🌟 The "Golden Rule" Prompt
*Paste this at the start of a new session to set the context.*

> "I am working on a FastAPI + Next.js project. We follow a strict **Backend-First** workflow: Database Schema → Backend Models → API Endpoints → Frontend Types → UI Components. Never suggest frontend code until the backend API is fully defined and tested. Please guide me step-by-step starting from the database layer."

---

## 📝 Feature Request Templates

### 1. New Feature (Complete)
> "I want to add a **[Feature Name]** feature.
> Please start by designing the **Database Schema** for this.
> List the necessary tables, fields, and relationships.
> Do not write any code yet, just the schema design for approval."

### 2. Backend Implementation (After Schema Approval)
> "The schema looks good. Now please:
> 1. Create the SQLAlchemy models in `backend/src/models.py`
> 2. Generate the Alembic migration
> 3. Create the Repository layer in `backend/src/repositories/`
> 4. Create the API endpoints in `backend/src/routers/`
> Please implement these one by one."

### 3. Frontend Integration (After Backend is Done)
> "The backend is ready and tested. Now let's move to frontend:
> 1. Define the TypeScript interfaces in `frontend/types/` based on the backend Pydantic models.
> 2. Create the API client functions in `frontend/lib/api/`.
> 3. Finally, build the UI components to use these APIs."

### 4. Existing UI / Mock Data Integration
> "I have a rich UI component `[Component Path]` that uses mock data.
> Please analyze the mock data structure in the file.
> 1. Design a **Backend Schema** (Pydantic/SQLAlchemy) that matches this data structure.
> 2. Implement the backend API to serve this exact format.
> 3. Once the API is ready, help me replace the mock data with the real API call."

---

## 🐛 Bug Fix Templates

### 1. API Error
> "I'm getting a 500 error on `POST /api/v1/resource`.
> Please analyze the backend logs and `backend/src/routers/resource.py`.
> Let's fix the backend logic first before touching the frontend."

### 2. Data Mismatch
> "The frontend is showing 'undefined' for the user's name.
> Please check the API response structure in `backend/src/routers/users.py` and compare it with the TypeScript interface in `frontend/types/user.ts`.
> Ensure the backend Pydantic model matches the frontend type."

---

## 🧠 "Vibe Check" Prompts
*Use these when the AI gets ahead of itself.*

- **Stop!** 🛑 "You are writing frontend code but we haven't defined the database model yet. Please revert and start with the database schema."
- **Verify** 🔍 "Before we build the UI, please write a test script or curl command to verify the API endpoint works."
- **Type Safety** 🛡️ "Please ensure the TypeScript interface exactly matches the Pydantic response model."

---

## 🚀 Quick Reference Workflow
1. **DB**: Schema & Migrations
2. **BE**: Models & Repos
3. **API**: Routes & Pydantic
4. **TEST**: Manual/Automated
5. **FE**: Types & Client
6. **UI**: Components & Pages
