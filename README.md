# Vertex AI Function Calling Chat App

This is a full-stack demo of a chat interface that supports function calling using Google Vertex AI + a product search API.

---

## 🔧 Tech Stack

* **Frontend**: Next.js + Tailwind (with `shadcn/ui` components)
* **Backend**: FastAPI using Vertex AI SDK
* **LLM**: `gemini-2.0-flash-001` with intent classification and chat response

---

## 🚀 Local Deployment Instructions

### 1. Backend Setup

```bash
cd vertex-chat-app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8182
```

* Ensure port 8182 is free
* Authenticate with Google Cloud:

```bash
gcloud auth application-default login
```

* Confirm project access to `gemini-2.0-flash-001`

### 2. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

* App runs on [http://localhost:3000](http://localhost:3000)

---

## 🌐 Endpoints

* `POST /chat`: Handles query, detects intent, generates response or fetches products
* `GET /health`: Health check endpoint

---

## ⚠️ Notes

* Assumes a working Decathlon Search API at `http://10.60.21.248:8000/search`
* Update the API URL in `backend/constants.py` if needed

---

## 🗃️ Version Control with Git

### 📅 Clone the Repository

```bash
git clone https://github.com/abdo1Hassan/GenUI-Poc.git
cd GenUI-Poc
```

### 🖕 Create a New Branch

```bash
git checkout -b feature/your-feature-name
```

> Use meaningful names, e.g., `feature/compare-ui` or `fix/search-bug`

### ✅ Commit Your Changes

```bash
git add .
git commit -m "✨ Add product comparison carousel"
```

### 👄 Push to GitHub

```bash
git push origin feature/your-feature-name
```

### 🔀 Create a Pull Request

* Open your GitHub repo and create a PR from your branch into `main`

---
