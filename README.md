# Vertex AI Function Calling Chat App

This is a modular full-stack demo of a conversational shopping assistant with function calling powered by Vertex AI + a custom product search API.

---

## 🔧 Tech Stack

- **Frontend**: Next.js + Tailwind (using `shadcn/ui`, drag-and-drop, and carousel components)
- **Backend**: FastAPI with modular intent-routing and Gemini function calling
- **LLM**: `gemini-2.0-flash-001`

---

## 🚀 Local Deployment Instructions

### 1. Clone and Setup

```bash
git clone https://github.com/abdo1Hassan/GenUI-Poc.git
cd GenUI-Poc
```

---

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the server
PYTHONPATH=. uvicorn backend.main:app --reload --port 8182
```

- Ensure port `8182` is free
- Authenticate with Google Cloud:

```bash
gcloud auth application-default login
```

- Project must have access to the `gemini-2.0-flash-001` model

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

- App runs at [http://localhost:3000](http://localhost:3000)

---

## 🌐 API Endpoints

- `POST /chat`: Main chat endpoint that routes based on intent
- `GET /health`: Basic health check

---

## 💡 Git Workflow

For contributing:

```bash
git add .              # stage all changes
git commit -m "your msg"  # commit with message
git push               # push to main (or a feature branch)
```

If needed:
```bash
git checkout -b feature/my-feature   # create and switch to new branch
git push -u origin feature/my-feature
```

---

## 🧠 Backend Architecture

```
backend/
├── main.py                # Entry point
├── routes/
│   └── chat.py            # POST /chat route
├── intents/               # Intent-specific logic
│   ├── intent_router.py
│   ├── chitchat.py
│   ├── find_product.py
│   ├── compare.py
│   └── reassure.py
├── services/              # External service integration
│   ├── gemini.py          # Gemini LLM usage
│   └── search.py          # Product search API logic
```

---

## ⚠️ Notes

- Make sure the Decathlon Search API is available at `http://10.60.21.248:8000/search`
- Update the endpoint in `services/search.py` if needed
- If you're running into import errors, make sure to launch with `PYTHONPATH=.`
