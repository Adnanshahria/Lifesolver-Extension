# LifeSolver Extension API Documentation

This document outlines the API endpoints consumed by the LifeSolver Browser Extension. The Extension is wired directly to the `LiveSolver Main Website` microservices architecture, which consists of the `auth-service` and `data-service`.

---

## 1. Base URL

**Target (LiveSolver Main Website):**
`https://life-solver.vercel.app/api`

The default base URL targets the main site's unified API endpoints. *(This can be dynamically overridden in `chrome.storage.local` via the `ls_api_url` key).*

---

## 2. Authentication APIs (`/api/auth/*`)

The `auth-service` handles all user authentication. 

### User Login
- **Endpoint:** `POST /api/auth/login`
- **Extension Usage:** `src/lib/api.ts` -> `API.login()`
- **Description:** Authenticates the user with email and password. On success, returns an auth token and user profile data which are immediately cached in the extension's `chrome.storage.local`.

### Verify Auth / Get Me
- **Endpoint:** `GET /api/auth/me`
- **Extension Usage:** `src/lib/api.ts` -> `API.verifyAuth()`
- **Description:** Uses the locally stored bearer token to verify if the user's session is still active.

### Detox OTP Flow
- **Request Endpoint:** `POST /api/auth/request-detox-otp`
- **Verify Endpoint:** `POST /api/auth/verify-detox-otp`
- **Extension Usage:** `src/lib/api.ts` -> `API.requestDetoxOtp()` & `API.verifyDetoxOtp()`
- **Description:** Manages the Dopamine Detox flow by sending a 6-digit OTP code to the user's email to prevent impulsive session termination, and verifying it securely.

---

## 3. Data Integration APIs (`/api/data/*`)

The `data-service` provides dynamic routing for all data tables. 

### Fetch Tasks (Pending Tasks)
- **Endpoint:** `GET /api/data/tasks`
- **Extension Usage:** `src/lib/api.ts` -> `API.fetchTasks()`
- **Description:** Retrieves the user's tasks. The extension filters out completed tasks to populate the "Pending Tasks" UI.

### Fetch Habits (Protocols)
- **Endpoint:** `GET /api/data/habits/all`
- **Extension Usage:** `src/lib/api.ts` -> `API.fetchHabits()`
- **Description:** Fetches daily habit entries. Evaluates completion status to display ongoing tasks in the "Habits" UI.

### Fetch Finance
- **Endpoint:** `GET /api/data/finance`
- **Extension Usage:** `src/lib/api.ts` -> `API.fetchFinance()`
- **Description:** Retrieves financial records via the generic table handler to display the net balance.

### Fetch Budgets
- **Endpoint:** `GET /api/data/budgets`
- **Extension Usage:** `src/lib/api.ts` -> `API.fetchBudgets()`
- **Description:** Retrieves user budget definitions via the generic table handler.

*Note on Sync:* The `data-service` also offers a unified `GET /api/data/all` sync endpoint which could be utilized in the future for fetching all user state in a single payload.

---

## 4. AI & Intelligence APIs (`/api/ai/*`)

### AI Enhance / Chat
- **Endpoint:** `POST /api/ai/enhance`
- **Extension Usage:** `src/lib/api.ts` -> `API.sendAIMessage()`
- **Description:** Sends the user's chat history and current input to the AI service for processing.

---

> **Security Note:** All protected endpoints under `/api/data/*` and `/api/ai/*` require the `Authorization: Bearer <token>` header to be successfully processed by the backend.
