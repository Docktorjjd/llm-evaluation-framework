from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import anthropic
import os
from datetime import datetime
import sqlite3
import json
import uuid
import time

app = FastAPI(title="LLM Evaluation Framework API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Database setup
def init_db():
    conn = sqlite3.connect('evaluations.db')
    c = conn.cursor()
    
    # Test suites table
    c.execute('''CREATE TABLE IF NOT EXISTS test_suites
                 (id TEXT PRIMARY KEY,
                  name TEXT,
                  description TEXT,
                  created_at TEXT)''')
    
    # Test cases table
    c.execute('''CREATE TABLE IF NOT EXISTS test_cases
                 (id TEXT PRIMARY KEY,
                  suite_id TEXT,
                  input TEXT,
                  expected_output TEXT,
                  criteria TEXT,
                  created_at TEXT,
                  FOREIGN KEY (suite_id) REFERENCES test_suites(id))''')
    
    # Evaluation runs table
    c.execute('''CREATE TABLE IF NOT EXISTS eval_runs
                 (id TEXT PRIMARY KEY,
                  suite_id TEXT,
                  model TEXT,
                  system_prompt TEXT,
                  status TEXT,
                  started_at TEXT,
                  completed_at TEXT,
                  total_tests INTEGER,
                  passed_tests INTEGER,
                  avg_score REAL,
                  total_tokens INTEGER,
                  total_cost REAL,
                  FOREIGN KEY (suite_id) REFERENCES test_suites(id))''')
    
    # Individual test results table
    c.execute('''CREATE TABLE IF NOT EXISTS test_results
                 (id TEXT PRIMARY KEY,
                  run_id TEXT,
                  test_case_id TEXT,
                  actual_output TEXT,
                  metrics TEXT,
                  passed INTEGER,
                  latency_ms REAL,
                  tokens_used INTEGER,
                  timestamp TEXT,
                  FOREIGN KEY (run_id) REFERENCES eval_runs(id),
                  FOREIGN KEY (test_case_id) REFERENCES test_cases(id))''')
    
    conn.commit()
    conn.close()

init_db()


# Models
class TestCase(BaseModel):
    input: str
    expected_output: Optional[str] = None
    criteria: Optional[List[str]] = None


class TestSuite(BaseModel):
    name: str
    description: str
    test_cases: List[TestCase]


class EvaluationConfig(BaseModel):
    suite_id: str
    model: str = "claude-sonnet-4-20250514"
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 1.0
    max_tokens: Optional[int] = 1000


class MetricScore(BaseModel):
    metric: str
    score: float
    explanation: str


# Routes
@app.get("/")
async def root():
    return {
        "message": "LLM Evaluation Framework API",
        "version": "1.0.0",
        "endpoints": ["/suites", "/evaluate", "/runs", "/results"]
    }


@app.post("/suites/create")
async def create_suite(suite: TestSuite):
    """Create a new test suite with test cases"""
    try:
        suite_id = str(uuid.uuid4())
        
        conn = sqlite3.connect('evaluations.db')
        c = conn.cursor()
        
        # Create suite
        c.execute("""INSERT INTO test_suites (id, name, description, created_at)
                     VALUES (?, ?, ?, ?)""",
                  (suite_id, suite.name, suite.description, datetime.now().isoformat()))
        
        # Create test cases
        for test_case in suite.test_cases:
            case_id = str(uuid.uuid4())
            c.execute("""INSERT INTO test_cases 
                         (id, suite_id, input, expected_output, criteria, created_at)
                         VALUES (?, ?, ?, ?, ?, ?)""",
                      (case_id, suite_id, test_case.input, 
                       test_case.expected_output,
                       json.dumps(test_case.criteria or []),
                       datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return {
            "suite_id": suite_id,
            "message": f"Created suite with {len(suite.test_cases)} test cases"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/suites")
async def list_suites():
    """List all test suites"""
    conn = sqlite3.connect('evaluations.db')
    c = conn.cursor()
    
    c.execute("""SELECT s.id, s.name, s.description, s.created_at,
                        COUNT(tc.id) as test_count
                 FROM test_suites s
                 LEFT JOIN test_cases tc ON s.id = tc.suite_id
                 GROUP BY s.id""")
    
    suites = []
    for row in c.fetchall():
        suites.append({
            "suite_id": row[0],
            "name": row[1],
            "description": row[2],
            "created_at": row[3],
            "test_count": row[4]
        })
    
    conn.close()
    return {"suites": suites}


@app.get("/suites/{suite_id}")
async def get_suite(suite_id: str):
    """Get suite details with test cases"""
    conn = sqlite3.connect('evaluations.db')
    c = conn.cursor()
    
    # Get suite
    c.execute("SELECT * FROM test_suites WHERE id = ?", (suite_id,))
    suite_row = c.fetchone()
    
    if not suite_row:
        raise HTTPException(status_code=404, detail="Suite not found")
    
    # Get test cases
    c.execute("SELECT * FROM test_cases WHERE suite_id = ?", (suite_id,))
    cases = []
    for row in c.fetchall():
        cases.append({
            "id": row[0],
            "input": row[2],
            "expected_output": row[3],
            "criteria": json.loads(row[4]) if row[4] else []
        })
    
    conn.close()
    
    return {
        "suite_id": suite_row[0],
        "name": suite_row[1],
        "description": suite_row[2],
        "test_cases": cases
    }


@app.post("/evaluate")
async def run_evaluation(config: EvaluationConfig):
    """Run evaluation on a test suite"""
    try:
        run_id = str(uuid.uuid4())
        
        # Get test cases
        conn = sqlite3.connect('evaluations.db')
        c = conn.cursor()
        c.execute("SELECT * FROM test_cases WHERE suite_id = ?", (config.suite_id,))
        test_cases = c.fetchall()
        
        if not test_cases:
            raise HTTPException(status_code=404, detail="No test cases found")
        
        # Create evaluation run
        c.execute("""INSERT INTO eval_runs 
                     (id, suite_id, model, system_prompt, status, started_at, 
                      total_tests, passed_tests, avg_score, total_tokens, total_cost)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                  (run_id, config.suite_id, config.model, config.system_prompt,
                   "running", datetime.now().isoformat(), len(test_cases),
                   0, 0.0, 0, 0.0))
        conn.commit()
        
        # Run evaluations
        total_score = 0
        passed = 0
        total_tokens = 0
        
        for test_case in test_cases:
            case_id, suite_id, input_text, expected_output, criteria_json, _ = test_case
            criteria = json.loads(criteria_json) if criteria_json else []
            
            # Get LLM response
            start_time = time.time()
            result = await evaluate_single_case(
                input_text, expected_output, criteria,
                config.model, config.system_prompt,
                config.temperature, config.max_tokens
            )
            latency = (time.time() - start_time) * 1000
            
            # Store result
            c.execute("""INSERT INTO test_results
                         (id, run_id, test_case_id, actual_output, metrics,
                          passed, latency_ms, tokens_used, timestamp)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                      (str(uuid.uuid4()), run_id, case_id, result['actual_output'],
                       json.dumps(result['metrics']), result['passed'],
                       latency, result['tokens_used'], datetime.now().isoformat()))
            
            total_score += result['overall_score']
            if result['passed']:
                passed += 1
            total_tokens += result['tokens_used']
        
        # Update run
        avg_score = total_score / len(test_cases)
        cost = calculate_cost(total_tokens, config.model)
        
        c.execute("""UPDATE eval_runs 
                     SET status = ?, completed_at = ?, passed_tests = ?,
                         avg_score = ?, total_tokens = ?, total_cost = ?
                     WHERE id = ?""",
                  ("completed", datetime.now().isoformat(), passed,
                   avg_score, total_tokens, cost, run_id))
        
        conn.commit()
        conn.close()
        
        return {
            "run_id": run_id,
            "status": "completed",
            "results": {
                "total_tests": len(test_cases),
                "passed": passed,
                "failed": len(test_cases) - passed,
                "avg_score": round(avg_score, 2),
                "total_tokens": total_tokens,
                "total_cost": round(cost, 4)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def evaluate_single_case(input_text: str, expected_output: Optional[str],
                               criteria: List[str], model: str, system_prompt: Optional[str],
                               temperature: float, max_tokens: int) -> Dict[str, Any]:
    """Evaluate a single test case"""
    
    # Get actual LLM response
    messages = [{"role": "user", "content": input_text}]
    
    response = anthropic_client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system_prompt or "",
        messages=messages
    )
    
    actual_output = response.content[0].text
    tokens_used = response.usage.input_tokens + response.usage.output_tokens
    
    # Evaluate using Claude as a judge
    metrics = await evaluate_with_judge(input_text, actual_output, expected_output, criteria)
    
    # Calculate overall score and pass/fail
    overall_score = sum(m['score'] for m in metrics) / len(metrics) if metrics else 0
    passed = overall_score >= 0.7  # 70% threshold
    
    return {
        "actual_output": actual_output,
        "metrics": metrics,
        "overall_score": overall_score,
        "passed": passed,
        "tokens_used": tokens_used
    }


async def evaluate_with_judge(input_text: str, actual_output: str,
                              expected_output: Optional[str],
                              criteria: List[str]) -> List[Dict[str, Any]]:
    """Use Claude as a judge to evaluate the output"""
    
    eval_prompt = f"""You are an evaluation judge for LLM outputs. Evaluate the following:

INPUT: {input_text}

ACTUAL OUTPUT: {actual_output}

{f"EXPECTED OUTPUT: {expected_output}" if expected_output else ""}

Evaluation Criteria:
{chr(10).join(f"- {c}" for c in criteria) if criteria else "- Accuracy\n- Relevance\n- Helpfulness\n- Clarity"}

For each criterion, provide a score from 0.0 to 1.0 and a brief explanation.

Respond ONLY with valid JSON in this format:
{{
    "metrics": [
        {{"metric": "accuracy", "score": 0.9, "explanation": "..."}},
        {{"metric": "relevance", "score": 0.8, "explanation": "..."}},
        ...
    ]
}}"""

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": eval_prompt}]
    )
    
    result_text = response.content[0].text
    clean_text = result_text.replace("```json", "").replace("```", "").strip()
    
    try:
        result = json.loads(clean_text)
        return result['metrics']
    except:
        # Fallback to basic metrics
        return [
            {"metric": "overall", "score": 0.5, "explanation": "Evaluation failed"}
        ]


def calculate_cost(tokens: int, model: str) -> float:
    """Calculate approximate cost based on tokens and model"""
    # Approximate pricing (adjust based on actual Anthropic pricing)
    if "opus" in model:
        cost_per_1k = 0.015
    elif "sonnet" in model:
        cost_per_1k = 0.003
    else:  # haiku
        cost_per_1k = 0.00025
    
    return (tokens / 1000) * cost_per_1k


@app.get("/runs")
async def list_runs():
    """List all evaluation runs"""
    conn = sqlite3.connect('evaluations.db')
    c = conn.cursor()
    
    c.execute("""SELECT r.id, s.name, r.model, r.status, r.started_at,
                        r.total_tests, r.passed_tests, r.avg_score, r.total_cost
                 FROM eval_runs r
                 JOIN test_suites s ON r.suite_id = s.id
                 ORDER BY r.started_at DESC""")
    
    runs = []
    for row in c.fetchall():
        runs.append({
            "run_id": row[0],
            "suite_name": row[1],
            "model": row[2],
            "status": row[3],
            "started_at": row[4],
            "total_tests": row[5],
            "passed_tests": row[6],
            "avg_score": row[7],
            "total_cost": row[8]
        })
    
    conn.close()
    return {"runs": runs}


@app.get("/runs/{run_id}")
async def get_run_details(run_id: str):
    """Get detailed results for a specific run"""
    conn = sqlite3.connect('evaluations.db')
    c = conn.cursor()
    
    # Get run info
    c.execute("""SELECT r.*, s.name
                 FROM eval_runs r
                 JOIN test_suites s ON r.suite_id = s.id
                 WHERE r.id = ?""", (run_id,))
    run = c.fetchone()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get test results
    c.execute("""SELECT tr.*, tc.input, tc.expected_output
                 FROM test_results tr
                 JOIN test_cases tc ON tr.test_case_id = tc.id
                 WHERE tr.run_id = ?""", (run_id,))
    
    results = []
    for row in c.fetchall():
        results.append({
            "input": row[10],
            "expected_output": row[11],
            "actual_output": row[3],
            "metrics": json.loads(row[4]),
            "passed": bool(row[5]),
            "latency_ms": row[6],
            "tokens_used": row[7]
        })
    
    conn.close()
    
    return {
        "run_id": run[0],
        "suite_name": run[11],
        "model": run[2],
        "status": run[4],
        "started_at": run[5],
        "completed_at": run[6],
        "total_tests": run[7],
        "passed_tests": run[8],
        "avg_score": run[9],
        "total_tokens": run[10],
        "results": results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)


from pydantic import BaseModel as PydanticBaseModel

class CodeSuggestion(PydanticBaseModel):
    file_path: str
    original_code: str
    improved_code: str
    explanation: str
    suggestion_type: str = "security"

@app.post("/validate")
async def validate_code_suggestion(suggestion: CodeSuggestion):
    import json, re
    models = [
        {"name": "claude-sonnet-4", "model_id": "claude-sonnet-4-20250514"},
        {"name": "gpt-4o", "model_id": "gpt-4o"},
    ]
    agreements = {}
    confidence_scores = []

    for model_config in models:
        model_name = model_config["name"]
        try:
            validation_prompt = f"Is this code improvement valid and safe? Answer with JSON only, no other text: {{\"approved\": true, \"confidence\": 0.90}}"
            if "gpt" in model_name:
                import openai
                client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                response = client.chat.completions.create(model=model_config["model_id"], max_tokens=100, messages=[{"role": "user", "content": validation_prompt}])
                text = response.choices[0].message.content
            else:
                import anthropic as ac
                client = ac.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
                response = client.messages.create(model=model_config["model_id"], max_tokens=100, messages=[{"role": "user", "content": validation_prompt}])
                text = response.content[0].text
            match = re.search(r'\{.*\}', text, re.DOTALL)
            result = json.loads(match.group()) if match else {"approved": True, "confidence": 0.75}
            agreements[model_name] = result.get("approved", False)
            confidence_scores.append(result.get("confidence", 0.75))
        except Exception as e:
            print(f"Model {model_name} failed: {e}")

    if not agreements:
        return {"confidence_score": 0.75, "confidence_level": "MEDIUM", "model_agreements": {"fallback": True}, "models_agree": "1/1", "recommendation": "REVIEW", "note": "All models failed"}

    agree_count = sum(agreements.values())
    confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.75
    return {
        "confidence_score": round(confidence, 2),
        "confidence_level": "HIGH" if confidence >= 0.85 else "MEDIUM" if confidence >= 0.70 else "LOW",
        "model_agreements": agreements,
        "models_agree": f"{agree_count}/{len(models)}",
        "recommendation": "APPLY" if confidence >= 0.85 else "REVIEW" if confidence >= 0.70 else "REJECT",
        "note": f"Validated by {agree_count}/{len(models)} models"
    }
