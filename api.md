# LifeSolver Extension API Documentation

This document outlines all the backend API endpoints consumed by the LifeSolver Browser Extension. These APIs are hosted and served by the main LifeSolver web application (located in the `Whn Web` folder) to provide a shared data state across the web dashboard and the browser extension.

## Base URL
By default, the Extension targets the main web app's API endpoint:
`https://lifeos-test.vercel.app/api`
*(This can be dynamically overridden in `chrome.storage.local` via the `ls_api_url` key).*

---

## 1. Authentication APIs

### User Login
- **Endpoint:** `POST /auth/login`
- **Source (Main Project):** Handled in `Whn Web` via `/api/auth/login`
- **Extension Usage:** `src/lib/api.ts` -> `API.login()`
- **Description:** Authenticates the user with email and password. On success, returns an auth token and user profile data which are immediately cached in the extension's `chrome.storage.local`.

### Verify Auth / Get Me
- **Endpoint:** `GET /auth/me`
- **Source (Main Project):** Handled in `Whn Web` via `/api/auth/me`
- **Extension Usage:** `src/lib/api.ts` -> `API.verifyAuth()`
- **Description:** Uses the locally stored bearer token to verify if the user's session is still active. It is triggered automatically when the extension UI mounts.

### Request Detox OTP
- **Endpoint:** `POST /auth/request-detox-otp`
- **Source (Main Project):** Handled in `Whn Web` via `/api/auth/request-detox-otp`
- **Extension Usage:** `src/lib/api.ts` -> `API.requestDetoxOtp()`
- **Description:** Used during the Dopamine Detox mode. When a user tries to end a detox session early, this endpoint sends a 6-digit OTP code to the logged-in user's email address.

### Verify Detox OTP
- **Endpoint:** `POST /auth/verify-detox-otp`
- **Source (Main Project):** Handled in `Whn Web` via `/api/auth/verify-detox-otp`
- **Extension Usage:** `src/lib/api.ts` -> `API.verifyDetoxOtp()`
- **Description:** Verifies the 6-digit OTP entered by the user to securely end an active Dopamine Detox session early.

---

## 2. Data Integration APIs

### Fetch Tasks (Pending Tasks)
- **Endpoint:** `GET /data/tasks`
- **Source (Main Project):** Handled in `Whn Web` via `/api/data/tasks` (Used by `useTasks.ts` hook)
- **Extension Usage:** `src/lib/api.ts` -> `API.fetchTasks()`
- **Description:** Retrieves the user's tasks. The extension filters out completed tasks ("done" status) to populate the "Pending Tasks" UI card.

### Fetch Habits (Protocols)
- **Endpoint:** `GET /data/habits`
- **Source (Main Project):** Handled in `Whn Web` via `/api/data/habits` 
- **Extension Usage:** `src/lib/api.ts` -> `API.fetchHabits()`
- **Description:** Fetches daily habit entries. The extension evaluates the completion status for the current day to display ongoing tasks in the "Habits" UI card.

### Fetch Finance
- **Endpoint:** `GET /data/finance`
- **Source (Main Project):** Handled in `Whn Web` via `/api/data/finance` (Used by `useFinance.ts` hook)
- **Extension Usage:** `src/lib/api.ts` -> `API.fetchFinance()`
- **Description:** Retrieves all financial records (income, expense, and special entries). The extension replicates the web app's logic to calculate total expenses and total income for regular entries, displaying the net balance in the "Financial" UI card.

---

## 3. AI & Intelligence APIs

### AI Enhance / Chat
- **Endpoint:** `POST /ai/enhance`
- **Source (Main Project):** Handled in `Whn Web` via `/api/ai/enhance`
- **Extension Usage:** `src/lib/api.ts` -> `API.sendAIMessage()`
- **Description:** Sends the user's chat history and current input to the LifeSolver AI core. Used in the extension's "Intelligence" tab to maintain a unified productivity assistant experience.

---

> **Security Note:** All protected endpoints under `/data/*` and `/ai/*` require an `Authorization: Bearer <token>` header to be successfully processed by the main project's backend.
