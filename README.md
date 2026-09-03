# ReflectAI - User-Authenticated Journaling & Gemini 3.6 Reflection Assistant

ReflectAI is a full-stack web application designed for private, mindful journaling and interactive multi-turn reflections powered by Google's **Gemini 3.6 Flash API** and backed by **Cloud Firestore** and **Firebase Authentication**.

---

## Architecture & Threat Model Overview

```
[ Client: React + Vite + Tailwind ]
            │
            ├─► [ Firebase Auth (Google Sign-In) ]
            ├─► [ Cloud Firestore (/users/{userId}/interactions/{interactionId}) ]
            │     └─► Enforced by Owner-Bound Firestore Security Rules
            │
            └─► [ Express Full-Stack Server (/api/gemini/reflect) ]
                  └─► [ Google GenAI SDK (gemini-3.6-flash + Fallback Ladder) ]
                        └─► [ Google Cloud Secret Manager (GEMINI_API_KEY) ]
```

## Production Deployment & Verification

ReflectAI is deployed and running on **Google Cloud Run** in `us-central1`.

**Production URL:** https://reflect-ai-798342046329.us-central1.run.app

The production deployment has been verified end-to-end with:

- **Firebase Authentication** — Google Sign-In and authenticated sessions
- **Cloud Run** — full-stack Express/React production hosting
- **Google Gemini** — Gemini-powered reflection and multi-turn conversations
- **Google Cloud Secret Manager** — server-side `GEMINI_API_KEY` protection
- **Cloud Firestore** — persistent, user-isolated journal interactions
- **Firestore Security Rules** — users can access only their own data
- **Past Entries** — persisted reflections remain available after sign-out/sign-in

The production application is configured to keep the Gemini API key on the server side and retrieve it from Secret Manager rather than exposing it to browser clients.

---

### Security & Privacy Protections
1. **Authentication-Gated Application**: Unauthenticated visitors only see the landing page; protected reflection APIs require a verified Firebase ID token.
2. **Owner-Bound Firestore Isolation**: Security rules restrict all queries to `/users/{request.auth.uid}/**`. Users cannot view, modify, or list another user's reflections.
3. **Zero Secrets in Frontend**: `GEMINI_API_KEY` is strictly held on the server side and never sent to browser clients.
4. **Resilient Gemini Model Fallback**: Requests start with `gemini-3.6-flash`. If the selected model is temporarily unavailable or fails, ReflectAI automatically attempts the next configured model in the fallback ladder.
5. **Defensive Payload Ingestion**: Zero-crash sanitation that strips `undefined` fields prior to Firestore writes.

---

### Server-Side Identity Verification
Firebase ID tokens are verified by the Express backend before Gemini reflection or synthesis requests are processed. The authenticated UID is taken from the verified token rather than from a client-supplied UID.

---

## 1. Prerequisites & Environment Setup

Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated:

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud Services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup

ReflectAI retrieves API credentials dynamically via environment variables / Secret Manager. Create and bind the secret to your Cloud Run runtime service account:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API Key as the secret payload
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the following owner-bound security rules to ensure complete user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User interactions, journal reflections, and chat history isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file
cp .env.example .env
# Fill in your GEMINI_API_KEY in .env

# 3. Start full-stack development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## 5. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run:

```bash
# Deploy to Google Cloud Run with Secret Manager mounting
gcloud run deploy reflect-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

---

## 6. Optional Campaign Verification Binding

If the challenge requires a verification label, apply it to the deployed Cloud Run service:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Functional Stability & Testing Walkthrough

The following test walkthrough covers the primary functional flows validated during development:

| Test Case | Scenario / Interaction | Expected Result |
| :--- | :--- | :--- |
| **TC-01: Landing & Auth Gate** | Unauthenticated user visits app. | Landing page renders with feature cards, trust badge, and Google Sign-In button. Main dashboard is inaccessible. |
| **TC-02: Google Sign-In** | User clicks "Continue with Google Sign-In". | Firebase Auth popup opens, authenticates user, and transitions seamlessly to the private Reflection Studio. |
| **TC-03: Prompt & Reflection** | User writes a journal thought and clicks "Begin Reflection". | Input is sent to `/api/gemini/reflect`, processed via `gemini-3.6-flash`, returns rich markdown reflection, and automatically persists to `/users/{userId}/interactions/{id}`. |
| **TC-04: Multi-Turn Conversation** | User submits a follow-up question in the same session. | Gemini receives the conversational history and replies in context. Both turns are saved in Firestore. |
| **TC-05: Strategy & Mood Switch** | User toggles strategy (e.g. Brainstorm, Clarity) or mood. | Reflection adjustments update context dynamically, reflected in UI badges and persisted metadata. |
| **TC-06: AI Insights & Synthesis** | User clicks "Synthesize Insights". | Endpoint `/api/gemini/summarize` generates an executive summary, suggested title, and key theme tags. |
| **TC-07: Past History & Search** | User navigates to "Past Entries" tab and searches keywords or filters by strategy. | User sees their past entries sorted by date, with instant search filtering and a copy-to-clipboard Markdown export option. |
| **TC-08: Deletion & Isolation** | User clicks delete on an entry and confirms. | Entry is permanently removed from `/users/{userId}/interactions/{id}` in Firestore and removed from list. |
| **TC-09: Sign Out** | User clicks sign-out button in header. | Auth session clears, private state is reset, and user returns to Landing view. |