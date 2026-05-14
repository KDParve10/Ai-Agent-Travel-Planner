# AI Travel Planner — Backend

A production-ready, multi-agent travel planning system built with FastAPI and advanced LLM orchestration (Gemini + Groq).

## 🚀 Key Features
- **Multi-Agent Orchestration**: Specialized agents for Research, Logistics, and Budgeting.
- **Resilient Pipeline**: Bounded repair loop with a Review Agent as a quality gate.
- **Hybrid LLM Setup**: Uses Gemini 1.5 Pro as primary and Llama 3 (via Groq) as a fallback.
- **Parallel Execution**: Concurrent agent processing using `asyncio` for low-latency responses.
- **Production Observability**: Request tracing with unique `trace_id` and structured logging.
- **Real Tool Integration**: Live search (Tavily) and real-time Exchange Rate APIs.

## 🛠 Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Valid API keys for Gemini, Groq, and Tavily.

### 2. Installation
```bash
# Clone the repository
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory (refer to `.env.example`):
```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
LOG_LEVEL=INFO
PRIMARY_PROVIDER=gemini
FALLBACK_PROVIDER=groq
```

### 4. Running the Server
```bash
uvicorn app.main:app --reload --port 8000
```

## 📡 API Documentation
Once running, visit `http://localhost:8000/docs` for the interactive OpenAPI documentation.

### Sample Request
`POST /api/plan`
```json
{
  "request": "Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds."
}
```

## 🏗 Architecture
The system follows a strict Orchestrator pattern:
1. **Extraction**: LLM extracts `TravelConstraints` from raw text.
2. **Parallel Workers**: Research, Logistics, and Budget agents run concurrently.
3. **Merge**: Orchestrator synthesizes worker outputs into a `DraftItinerary`.
4. **Review & Repair**: A Review Agent evaluates the plan. If issues are found, the Orchestrator performs a bounded repair loop (max 2 retries).
5. **Final Delivery**: A high-fidelity JSON plan is returned to the user.

---
*Developed for the AI Travel Planner System Architecture.*
