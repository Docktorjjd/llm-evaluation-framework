# 📊 LLM Evaluation Framework

A production-ready evaluation and testing framework for LLM applications. Automate testing, measure performance, track metrics, and ensure quality across your AI systems.

## 🎯 Project Overview

This work sample demonstrates:
- **Automated Testing**: Create test suites and run evaluations automatically
- **LLM-as-a-Judge**: Uses Claude to evaluate outputs against criteria
- **Multiple Metrics**: Accuracy, relevance, helpfulness, clarity, and custom metrics
- **Performance Tracking**: Monitor tokens, latency, cost, and quality over time
- **A/B Testing**: Compare different models, prompts, or configurations
- **Production Readiness**: Database persistence, RESTful API, visualization dashboard

Perfect for AI Engineer portfolios - shows you understand evaluation and quality assurance for AI systems.

## ✨ Key Features

### Evaluation Capabilities
- ✅ **Automated Test Suites**: Define test cases with inputs and expected outputs
- ✅ **LLM-as-Judge**: Claude evaluates responses against criteria
- ✅ **Multiple Metrics**: Score on accuracy, relevance, helpfulness, tone, etc.
- ✅ **Pass/Fail Thresholds**: Automatic pass/fail based on score thresholds
- ✅ **Batch Evaluation**: Test hundreds of cases at once
- ✅ **Custom Criteria**: Define your own evaluation criteria per test

### Tracking & Analysis
- ✅ **Performance Metrics**: Latency, tokens used, cost per test
- ✅ **Historical Data**: SQLite database stores all results
- ✅ **Trend Analysis**: See quality changes over time
- ✅ **Visual Dashboard**: Charts and graphs for results
- ✅ **Detailed Reports**: Export results as JSON or view in UI

### Production Features
- ✅ **RESTful API**: Clean FastAPI backend
- ✅ **Database Persistence**: SQLite for test suites and results
- ✅ **React Dashboard**: Beautiful visualization of results
- ✅ **Scalable Architecture**: Easy to extend with new metrics
- ✅ **Cost Tracking**: Monitor API costs across evaluations

## 🏗️ Architecture

```
Test Suite → Evaluation Engine → LLM Response
                ↓
          Claude as Judge → Metrics Calculation
                ↓
          Database Storage → Dashboard Visualization
```

### Evaluation Flow

1. **Create Test Suite**: Define inputs, expected outputs, criteria
2. **Run Evaluation**: System sends inputs to LLM, gets responses
3. **Judge Responses**: Claude evaluates each response against criteria
4. **Calculate Metrics**: Aggregate scores, pass/fail, performance data
5. **Store Results**: Save to database for historical tracking
6. **Visualize**: View results in dashboard with charts

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Anthropic API key

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your ANTHROPIC_API_KEY

# Run server
python main.py
```

Backend runs at `http://localhost:8002`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:3000`

## 📁 Project Structure

```
llm-evaluation-framework/
├── backend/
│   ├── main.py               # FastAPI server with evaluation logic
│   ├── evaluations.db        # SQLite database (created on first run)
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component with dashboard
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
│
└── README.md
```

## 🎮 How to Use

### 1. Create a Test Suite

Define test cases for your LLM application:

```json
{
  "name": "Chatbot Helpfulness Test",
  "description": "Evaluate chatbot responses for helpfulness",
  "test_cases": [
    {
      "input": "How do I reset my password?",
      "expected_output": "I'll help you reset your password...",
      "criteria": ["accuracy", "helpfulness", "clarity"]
    },
    {
      "input": "What are your business hours?",
      "expected_output": "Our business hours are...",
      "criteria": ["accuracy", "completeness"]
    }
  ]
}
```

### 2. Run Evaluation

Execute the test suite:
- Click "Run" on a test suite
- System sends each input to the LLM
- Claude judges each response
- Results are stored and displayed

### 3. View Results

See detailed metrics:
- Overall pass rate
- Average scores per metric
- Individual test results
- Performance data (latency, tokens, cost)
- Visual charts and graphs

### 4. Iterate and Improve

Use results to:
- Improve prompts
- Tune system settings
- Compare different models
- Track quality over time

## 🔧 API Endpoints

### `POST /suites/create`
Create a new test suite

**Request**:
```json
{
  "name": "Test Suite Name",
  "description": "What this tests",
  "test_cases": [
    {
      "input": "test input",
      "expected_output": "expected response",
      "criteria": ["accuracy", "helpfulness"]
    }
  ]
}
```

### `GET /suites`
List all test suites

### `GET /suites/{suite_id}`
Get suite details with test cases

### `POST /evaluate`
Run evaluation on a test suite

**Request**:
```json
{
  "suite_id": "uuid",
  "model": "claude-sonnet-4-20250514",
  "system_prompt": "You are a helpful assistant",
  "temperature": 1.0,
  "max_tokens": 1000
}
```

### `GET /runs`
List all evaluation runs

### `GET /runs/{run_id}`
Get detailed results for a run

## 💡 Evaluation Metrics

### Default Metrics
- **Accuracy**: Does it provide correct information?
- **Relevance**: Does it address the question asked?
- **Helpfulness**: Is it useful to the user?
- **Clarity**: Is it easy to understand?
- **Completeness**: Does it cover all aspects?

### Custom Metrics
Define your own criteria:
- Tone appropriateness
- Safety/harmlessness
- Factual accuracy
- Source citations
- Code correctness
- Creative quality

### Scoring
- Each metric scored 0.0 to 1.0
- Overall score is average of all metrics
- Default pass threshold: 0.7 (70%)
- Configurable per test suite

## 📊 Use Cases

### 1. RAG System Evaluation
Test if your RAG system:
- Cites sources correctly
- Provides accurate information
- Handles missing information gracefully
- Avoids hallucinations

### 2. Chatbot Quality Assurance
Evaluate chatbot on:
- Helpfulness
- Appropriate tone
- Accurate information
- Consistent personality

### 3. Prompt Engineering
A/B test different prompts:
- Version A vs Version B
- Track which performs better
- Optimize based on metrics

### 4. Model Comparison
Compare different models:
- Claude Opus vs Sonnet vs Haiku
- GPT-4 vs Claude
- Cost vs quality tradeoffs

### 5. Regression Testing
Monitor quality over time:
- Does quality degrade with changes?
- Track performance trends
- Catch regressions early

## 🧪 Example Test Suites

### Customer Support Chatbot
```json
{
  "name": "Customer Support Quality",
  "test_cases": [
    {
      "input": "I received a damaged product",
      "criteria": ["empathy", "actionable_solution", "professionalism"]
    },
    {
      "input": "Where is my order?",
      "criteria": ["accuracy", "helpfulness", "clarity"]
    }
  ]
}
```

### Code Generation
```json
{
  "name": "Code Quality Test",
  "test_cases": [
    {
      "input": "Write a function to sort an array",
      "criteria": ["correctness", "efficiency", "readability"]
    }
  ]
}
```

### Content Moderation
```json
{
  "name": "Safety Test",
  "test_cases": [
    {
      "input": "Harmful request",
      "expected_output": "Polite refusal",
      "criteria": ["safety", "professionalism"]
    }
  ]
}
```

## 📈 Dashboard Features

### Overview Stats
- Total test suites
- Total evaluation runs
- Average pass rate
- Total cost spent

### Test Suite Management
- Create new suites
- View existing suites
- Run evaluations
- See test case details

### Results Visualization
- Pass/fail pie charts
- Score distributions
- Latency graphs
- Cost analysis
- Individual test details

### Historical Tracking
- All runs stored in database
- Compare runs over time
- Track quality trends
- Monitor performance

## 🔍 Technical Details

### LLM-as-a-Judge Implementation

```python
async def evaluate_with_judge(input_text, actual_output, 
                              expected_output, criteria):
    """
    Uses Claude to evaluate the LLM output
    Returns metrics with scores and explanations
    """
    eval_prompt = f"""
    Evaluate this LLM output:
    
    Input: {input_text}
    Output: {actual_output}
    Expected: {expected_output}
    
    Criteria: {criteria}
    
    Score each criterion 0.0-1.0 with explanation.
    """
    
    # Get Claude's evaluation
    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        messages=[{"role": "user", "content": eval_prompt}]
    )
    
    # Parse scores and explanations
    return parse_metrics(response)
```

### Database Schema

```sql
-- Test suites
CREATE TABLE test_suites (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    created_at TEXT
);

-- Test cases
CREATE TABLE test_cases (
    id TEXT PRIMARY KEY,
    suite_id TEXT,
    input TEXT,
    expected_output TEXT,
    criteria TEXT,  -- JSON array
    created_at TEXT
);

-- Evaluation runs
CREATE TABLE eval_runs (
    id TEXT PRIMARY KEY,
    suite_id TEXT,
    model TEXT,
    status TEXT,
    started_at TEXT,
    completed_at TEXT,
    total_tests INTEGER,
    passed_tests INTEGER,
    avg_score REAL,
    total_tokens INTEGER,
    total_cost REAL
);

-- Individual test results
CREATE TABLE test_results (
    id TEXT PRIMARY KEY,
    run_id TEXT,
    test_case_id TEXT,
    actual_output TEXT,
    metrics TEXT,  -- JSON array of scores
    passed INTEGER,
    latency_ms REAL,
    tokens_used INTEGER,
    timestamp TEXT
);
```

## 🚧 Future Enhancements

- [ ] Integration with CI/CD pipelines
- [ ] Slack/email notifications for failures
- [ ] Export reports to PDF/CSV
- [ ] Advanced statistical analysis
- [ ] Custom metric plugins
- [ ] Multi-model comparison dashboard
- [ ] Automated regression detection
- [ ] Real-time monitoring mode
- [ ] Integration with observability tools
- [ ] Team collaboration features

## 💰 Cost Considerations

Typical costs per evaluation run:
- **Small suite** (10 tests): $0.05-0.15
- **Medium suite** (50 tests): $0.25-0.75
- **Large suite** (100+ tests): $0.50-1.50

Tips to reduce costs:
- Use Haiku for judge evaluations
- Batch similar tests
- Cache evaluation results
- Set appropriate max_tokens limits

## 🎓 Learning Outcomes

This project demonstrates:
1. **Evaluation methodologies** for LLMs
2. **LLM-as-a-Judge** pattern implementation
3. **Database design** for ML systems
4. **API design** for evaluation workflows
5. **Visualization** of evaluation metrics
6. **Production testing** strategies

## 📝 License

Portfolio/work sample project. Free to reference.

## 🙏 Acknowledgments

- **Anthropic** for Claude API
- **FastAPI** for backend framework
- **Recharts** for data visualization
- **React** for frontend

---

**Portfolio Note**: This project showcases production-ready evaluation infrastructure for LLM applications including automated testing, metrics tracking, and quality assurance workflows. Demonstrates understanding of testing and evaluation - critical for production AI systems and perfect for AI Engineering roles.
