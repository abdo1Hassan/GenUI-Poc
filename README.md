
# Vertex AI Function Calling Chat App

This is a full-stack demo of a chat interface that supports function calling using Google Vertex AI + a product search API.

---

## 🔧 Tech Stack

- **Frontend**: Next.js + Tailwind (with `shadcn/ui` components)
- **Backend**: FastAPI using Vertex AI SDK
- **LLM**: `gemini-2.0-flash-001` with function calling

---

## 🚀 Local Deployment Instructions

### 1. Backend Setup

```bash
cd vertex-chat-app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8184
```

- Ensure port 8184 is free
- Make sure you’re authenticated with `gcloud auth application-default login`
- Project ID should be set to the Vertex project with access to `gemini-2.0-flash-001`

---

### 2. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

- App will run on [http://localhost:3000](http://localhost:3000)

---

## 🌐 Endpoints

- `POST /chat`: Main chat logic + function calling
- `GET /health`: Simple health check

---

## ⚠️ Notes

- This assumes a working Decathlon Search API is available at `http://10.60.21.248:3000/search`
- If needed, update this in `backend/main.py`

---
