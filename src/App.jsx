import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import LogsDashboard from './components/LogsDashboard';
import { BarChart2, Cpu, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('visualizer');
  const [activeVersion, setActiveVersion] = useState('88910545');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [executingPath, setExecutingPath] = useState(null);
  const [chatMode, setChatMode] = useState('mock'); // 'mock' | 'webhook' | 'gemini'
  
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your AI Study Assistant. I can help you understand syllabus concepts, textbook definitions, and walk you through difficult problems. Feel free to ask a question, or ask me for a 'practice quiz' on any topic!",
      timestamp: new Date()
    }
  ]);
  
  const [executions, setExecutions] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // RAG Ingester Panel states
  const [ingestText, setIngestText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');

  const sessionId = 'student-session-001';
  const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

  // 1. Initial Load of Session History from database
  React.useEffect(() => {
    fetch(`${BACKEND_URL}/api/sessions/${sessionId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data.length > 0) {
          setChatHistory(data);
        }
      })
      .catch(err => console.error("Error loading session history from database:", err));
  }, []);

  // 2. Load execution logs on mount and when histories change
  React.useEffect(() => {
    fetch(`${BACKEND_URL}/api/logs`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setExecutions(data))
      .catch(err => console.error("Error loading executions logs:", err));
  }, [chatHistory]);

  // 3. Handle sending messages via Backend API
  const handleSendMessage = async (userMessage) => {
    setIsProcessing(true);
    setExecutingPath(null);

    const isExistingSession = chatHistory.length > 1;
    const path = isExistingSession ? 'A' : 'B';
    setExecutingPath(path);

    // Start steps visual simulator
    let activeSimStep = 1;
    setActiveStep(1);
    const interval = setInterval(() => {
      activeSimStep++;
      if (activeSimStep <= 7) {
        setActiveStep(activeSimStep);
      }
    }, 250);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          chatMode,
          activeVersion,
          apiKey: localStorage.getItem('gemini_api_key')
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred');
      }

      // Sync updated history and execution logs from database files
      const historyResponse = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setChatHistory(historyData);
      }

      const logsResponse = await fetch(`${BACKEND_URL}/api/logs`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setExecutions(logsData);
      }

    } catch (err) {
      console.error(err);
      
      // Inject failure card to chat
      setChatHistory(prev => [...prev, {
        id: 'fail-' + Date.now(),
        sender: 'assistant',
        text: `⚠️ **Study Assistant Connection Failed**
Could not connect to backend server or webhook endpoint.

### Troubleshooting:
*   Make sure the Express backend server is running in the terminal (\`node server.js\` or \`npm run dev\`).
*   If in Gemini mode, check your API key in the settings drawer.
*   If in Webhook mode, make sure your internet is active.`,
        timestamp: new Date()
      }]);
    } finally {
      clearInterval(interval);
      setActiveStep(11);
      await new Promise(r => setTimeout(r, 200));
      setActiveStep(0);
      setIsProcessing(false);
      setExecutingPath(null);
    }
  };

  // 4. Handle Document RAG Upload
  const handleIngestDocument = async () => {
    setIsIngesting(true);
    setIngestStatus('Connecting to server...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: ingestText,
          apiKey: localStorage.getItem('gemini_api_key')
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      setIngestStatus(data.message || 'Indexed successfully!');
      setIngestText('');
      setTimeout(() => setIngestStatus(''), 4000);
    } catch (err) {
      setIngestStatus(`Error: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar glass-panel">
        <div className="sidebar-top">
          {/* Logo Brand */}
          <div className="brand">
            <div className="brand-logo">
              <Sparkles size={18} />
            </div>
            <div className="brand-info">
              <h1 className="gradient-text">AI study</h1>
              <span>Study Assistant UI</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="nav-group">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`nav-btn ${activeTab === 'visualizer' ? 'nav-btn-active' : ''}`}
            >
              <Cpu size={16} /> Playbook Visualizer
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`nav-btn ${activeTab === 'logs' ? 'nav-btn-active' : ''}`}
            >
              <BarChart2 size={16} /> Run Executions
            </button>
          </div>
        </div>

        {/* Footer details */}
        <div className="sidebar-footer">
          <div>OS: WINDOWS</div>
          <div>PROJECT: STUDY-ASSISTANT</div>
          <div style={{ color: 'var(--accent-purple-light)' }}>TARGET: 3 VERSIONS</div>
        </div>
      </div>

      {/* Main Panel Stage */}
      <div className="main-stage">
        {/* Chat Console */}
        <ChatInterface 
          activeVersion={activeVersion}
          setActiveVersion={setActiveVersion}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          chatMode={chatMode}
          setChatMode={setChatMode}
        />

        {/* Stage Content Area (Visualizer or Logs Dashboard) */}
        <div className="stage-content">
          {activeTab === 'visualizer' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <WorkflowVisualizer 
                activeStep={activeStep}
                executingPath={executingPath}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
              />
              
              {/* Document Ingestion Admin Card */}
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
                <h3 style={{ fontSize: '11px', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Sparkles size={13} style={{ color: 'var(--accent-purple-light)' }} />
                  n8n Document Ingest (RAG Upload)
                </h3>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                  Paste syllabus contents below. Documents are split, embedded via Gemini, and indexed into the Qdrant database.
                </p>
                <textarea 
                  placeholder="Paste syllabus, textbook chapters, or curriculum notes here..."
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', fontSize: '9px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', resize: 'vertical', fontFamily: 'inherit', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={handleIngestDocument}
                    disabled={isIngesting || !ingestText.trim()}
                    className="mode-toggle-btn mode-toggle-mock"
                    style={{ fontSize: '9px', padding: '6px 12px', opacity: (isIngesting || !ingestText.trim()) ? 0.6 : 1 }}
                  >
                    {isIngesting ? 'Indexing in Vector DB...' : 'Upload & Index'}
                  </button>
                  {ingestStatus && <span style={{ fontSize: '9px', color: ingestStatus.includes('Error') ? 'var(--accent-coral-light)' : 'var(--accent-emerald-light)' }}>{ingestStatus}</span>}
                </div>
              </div>
            </div>
          ) : (
            <LogsDashboard executions={executions} />
          )}
        </div>
      </div>
    </div>
  );
}
