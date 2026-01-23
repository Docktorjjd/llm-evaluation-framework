import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Play, Plus, FileText, CheckCircle, XCircle, TrendingUp, Clock, DollarSign, Zap } from 'lucide-react';

const API_BASE = 'http://localhost:8002';

export default function EvaluationFramework() {
  const [suites, setSuites] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [activeTab, setActiveTab] = useState('suites');
  const [showCreateSuite, setShowCreateSuite] = useState(false);

  useEffect(() => {
    fetchSuites();
    fetchRuns();
  }, []);

  const fetchSuites = async () => {
    try {
      const response = await fetch(`${API_BASE}/suites`);
      const data = await response.json();
      setSuites(data.suites || []);
    } catch (error) {
      console.error('Error fetching suites:', error);
    }
  };

  const fetchRuns = async () => {
    try {
      const response = await fetch(`${API_BASE}/runs`);
      const data = await response.json();
      setRuns(data.runs || []);
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };

  const viewRunDetails = async (runId) => {
    try {
      const response = await fetch(`${API_BASE}/runs/${runId}`);
      const data = await response.json();
      setSelectedRun(data);
      setActiveTab('results');
    } catch (error) {
      console.error('Error fetching run details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              LLM Evaluation Framework
            </h1>
          </div>
          <p className="text-slate-300 ml-13">Automated testing and evaluation for LLM applications</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Test Suites"
            value={suites.length}
            color="blue"
          />
          <StatCard
            icon={<Play className="w-6 h-6" />}
            label="Total Runs"
            value={runs.length}
            color="purple"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Avg Pass Rate"
            value={runs.length > 0 ? `${Math.round(runs.reduce((acc, r) => acc + (r.passed_tests / r.total_tests * 100), 0) / runs.length)}%` : '0%'}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Cost"
            value={`$${runs.reduce((acc, r) => acc + (r.total_cost || 0), 0).toFixed(2)}`}
            color="yellow"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <TabButton
            active={activeTab === 'suites'}
            onClick={() => setActiveTab('suites')}
            icon={<FileText className="w-4 h-4" />}
            label="Test Suites"
          />
          <TabButton
            active={activeTab === 'runs'}
            onClick={() => setActiveTab('runs')}
            icon={<Play className="w-4 h-4" />}
            label="Evaluation Runs"
          />
          {selectedRun && (
            <TabButton
              active={activeTab === 'results'}
              onClick={() => setActiveTab('results')}
              icon={<TrendingUp className="w-4 h-4" />}
              label="Results"
            />
          )}
        </div>

        {/* Content */}
        {activeTab === 'suites' && (
          <SuitesView
            suites={suites}
            onCreateNew={() => setShowCreateSuite(true)}
            onRefresh={fetchSuites}
          />
        )}

        {activeTab === 'runs' && (
          <RunsView
            runs={runs}
            onViewDetails={viewRunDetails}
            onRefresh={fetchRuns}
          />
        )}

        {activeTab === 'results' && selectedRun && (
          <ResultsView run={selectedRun} />
        )}

        {/* Create Suite Modal */}
        {showCreateSuite && (
          <CreateSuiteModal
            onClose={() => setShowCreateSuite(false)}
            onSuccess={() => {
              setShowCreateSuite(false);
              fetchSuites();
            }}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue: 'from-blue-600 to-blue-800',
    purple: 'from-purple-600 to-purple-800',
    green: 'from-green-600 to-green-800',
    yellow: 'from-yellow-600 to-yellow-800'
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-lg p-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-200 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-white opacity-80">{icon}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
        active
          ? 'text-blue-400 border-b-2 border-blue-400'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SuitesView({ suites, onCreateNew, onRefresh }) {
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runEvaluation = async (suiteId) => {
    setIsRunning(true);
    try {
      const response = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suite_id: suiteId,
          model: 'claude-sonnet-4-20250514',
          system_prompt: 'You are a helpful assistant.'
        })
      });

      const data = await response.json();
      alert(`Evaluation complete!\nPassed: ${data.results.passed}/${data.results.total_tests}\nScore: ${data.results.avg_score}`);
      onRefresh();
    } catch (error) {
      alert('Evaluation failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Test Suites</h2>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Suite
          </button>
        </div>

        {suites.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No test suites yet</p>
            <p className="text-sm mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suites.map(suite => (
              <div
                key={suite.suite_id}
                onClick={() => setSelectedSuite(suite)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedSuite?.suite_id === suite.suite_id
                    ? 'bg-blue-900/40 border border-blue-500'
                    : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <h3 className="font-semibold mb-1">{suite.name}</h3>
                <p className="text-sm text-slate-400 mb-2">{suite.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{suite.test_count} test cases</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runEvaluation(suite.suite_id);
                    }}
                    disabled={isRunning}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded text-sm transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Suite Details</h2>
        {selectedSuite ? (
          <SuiteDetails suite={selectedSuite} />
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>Select a suite to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SuiteDetails({ suite }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [suite.suite_id]);

  const fetchDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/suites/${suite.suite_id}`);
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error('Error fetching suite details:', error);
    }
  };

  if (!details) return <div>Loading...</div>;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">{details.name}</h3>
      <p className="text-slate-400 text-sm mb-4">{details.description}</p>
      
      <h4 className="font-medium mb-2">Test Cases ({details.test_cases?.length || 0})</h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {details.test_cases?.map((tc, idx) => (
          <div key={idx} className="p-3 bg-slate-900/50 rounded-lg text-sm">
            <div className="font-medium mb-1">Test {idx + 1}</div>
            <div className="text-slate-400">
              <strong>Input:</strong> {tc.input.substring(0, 100)}...
            </div>
            {tc.expected_output && (
              <div className="text-slate-400 mt-1">
                <strong>Expected:</strong> {tc.expected_output.substring(0, 100)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RunsView({ runs, onViewDetails, onRefresh }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Evaluation Runs</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No evaluation runs yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Suite</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Model</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Pass Rate</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Avg Score</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Cost</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.run_id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  <td className="p-3">{run.suite_name}</td>
                  <td className="p-3 text-sm text-slate-400">{run.model.split('-')[1]}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      run.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="p-3">{run.passed_tests}/{run.total_tests}</td>
                  <td className="p-3">{run.avg_score?.toFixed(2) || 'N/A'}</td>
                  <td className="p-3 text-sm">${run.total_cost?.toFixed(4) || '0.00'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => onViewDetails(run.run_id)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ResultsView({ run }) {
  const passRate = (run.passed_tests / run.total_tests) * 100;
  
  const pieData = [
    { name: 'Passed', value: run.passed_tests, color: '#22c55e' },
    { name: 'Failed', value: run.total_tests - run.passed_tests, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-2">{run.suite_name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <MetricCard icon={<CheckCircle />} label="Pass Rate" value={`${passRate.toFixed(1)}%`} />
          <MetricCard icon={<TrendingUp />} label="Avg Score" value={run.avg_score?.toFixed(2)} />
          <MetricCard icon={<Zap />} label="Total Tokens" value={run.total_tokens?.toLocaleString()} />
          <MetricCard icon={<Clock />} label="Avg Latency" value={`${(run.results?.reduce((a, r) => a + r.latency_ms, 0) / run.results?.length || 0).toFixed(0)}ms`} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Pass/Fail Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                <span className="text-sm">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {run.results?.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                <span className="text-sm">Test {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{(result.metrics.reduce((a, m) => a + m.score, 0) / result.metrics.length).toFixed(2)}</span>
                  {result.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Detailed Test Results</h3>
        <div className="space-y-4">
          {run.results?.map((result, idx) => (
            <details key={idx} className="bg-slate-900/50 rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Test {idx + 1}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">{result.latency_ms.toFixed(0)}ms</span>
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              </summary>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <strong className="text-slate-400">Input:</strong>
                  <p className="mt-1 text-slate-300">{result.input}</p>
                </div>
                <div>
                  <strong className="text-slate-400">Output:</strong>
                  <p className="mt-1 text-slate-300">{result.actual_output}</p>
                </div>
                <div>
                  <strong className="text-slate-400">Metrics:</strong>
                  <div className="mt-2 space-y-2">
                    {result.metrics.map((metric, midx) => (
                      <div key={midx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <span className="capitalize">{metric.metric}</span>
                        <span className={metric.score >= 0.7 ? 'text-green-400' : 'text-yellow-400'}>
                          {(metric.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="p-3 bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function CreateSuiteModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState([{ input: '', expected_output: '', criteria: [] }]);

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expected_output: '', criteria: [] }]);
  };

  const updateTestCase = (idx, field, value) => {
    const updated = [...testCases];
    updated[idx][field] = value;
    setTestCases(updated);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE}/suites/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          test_cases: testCases.filter(tc => tc.input.trim())
        })
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      alert('Error creating suite: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Test Suite</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Suite Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chatbot Helpfulness Test"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="What does this test suite evaluate?"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Test Cases</label>
              <button
                onClick={addTestCase}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                + Add Test Case
              </button>
            </div>

            {testCases.map((tc, idx) => (
              <div key={idx} className="p-3 bg-slate-700/50 rounded-lg mb-2">
                <input
                  type="text"
                  value={tc.input}
                  onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Test input/prompt"
                />
                <input
                  type="text"
                  value={tc.expected_output}
                  onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Expected output (optional)"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Create Suite
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}