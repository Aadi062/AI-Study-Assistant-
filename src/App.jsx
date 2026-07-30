import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import LogsDashboard from './components/LogsDashboard';
import { BarChart2, Cpu, Sparkles, MessageSquare, Plus, Edit2, Check, X, Trash2 } from 'lucide-react';

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

  const [currentSessionId, setCurrentSessionId] = useState('student-session-001');
  const [sessionsList, setSessionsList] = useState([]);
  const [isThreadsExpanded, setIsThreadsExpanded] = useState(true);
  const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

  const loadSessionHistory = (sessId) => {
    fetch(`${BACKEND_URL}/api/sessions/${sessId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data.length > 0) {
          setChatHistory(data);
        } else {
          setChatHistory([
            {
              id: 'welcome',
              sender: 'assistant',
              text: "Hello! I am your AI Study Assistant. I can help you understand syllabus concepts, textbook definitions, and walk you through difficult problems. Feel free to ask a question, or ask me for a 'practice quiz' on any topic!",
              timestamp: new Date()
            }
          ]);
        }
      })
      .catch(err => console.error("Error loading session history from database:", err));
  };

  const loadSessions = async (selectId = null) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessionsList(data);
        if (data.length > 0) {
          const targetId = selectId || currentSessionId;
          const exists = data.some(s => s.sessionId === targetId);
          const activeId = exists ? targetId : data[0].sessionId;
          setCurrentSessionId(activeId);
          loadSessionHistory(activeId);
        } else {
          handleCreateNewThread();
        }
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  };

  const handleCreateNewThread = async () => {
    const newSessionId = 'session-' + Date.now() + '-' + Math.random().toString(16).substring(2, 6);
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          message: 'Initialize Thread',
          chatMode: 'mock',
          activeVersion,
          apiKey: localStorage.getItem('gemini_api_key'),
          isInit: true
        })
      });

      if (response.ok) {
        setCurrentSessionId(newSessionId);
        await loadSessions(newSessionId);
      }
    } catch (err) {
      console.error("Error creating new thread:", err);
    }
  };

  const handleRenameThread = async (sessId, newName) => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/${sessId}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        await loadSessions(sessId);
      }
    } catch (err) {
      console.error("Error renaming thread:", err);
    }
  };

  const handleDeleteThread = async (sessId, e) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this thread?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/${sessId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const targetId = sessId === currentSessionId ? null : currentSessionId;
        await loadSessions(targetId);
      }
    } catch (err) {
      console.error("Error deleting thread:", err);
    }
  };

  // 1. Initial Load of Sessions from database
  React.useEffect(() => {
    loadSessions();
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
          sessionId: currentSessionId,
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
      const historyResponse = await fetch(`${BACKEND_URL}/api/sessions/${currentSessionId}`);
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

          {/* Active Chats Threads Section */}
          <div className="threads-section">
            <div 
              onClick={() => setIsThreadsExpanded(!isThreadsExpanded)}
              className="threads-header"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  transition: 'transform 0.2s', 
                  transform: isThreadsExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                  fontSize: '8px', 
                  display: 'inline-block' 
                }}>▶</span>
                <span>Active Threads</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateNewThread();
                }} 
                className="new-thread-link"
                title="Create new thread"
              >
                <Plus size={10} /> New
              </button>
            </div>
            {isThreadsExpanded && (
              <div className="threads-list">
                {sessionsList.map(sessionItem => (
                  <ThreadItem 
                    key={sessionItem.sessionId}
                    session={sessionItem}
                    isActive={sessionItem.sessionId === currentSessionId}
                    onSelect={() => {
                      setCurrentSessionId(sessionItem.sessionId);
                      loadSessionHistory(sessionItem.sessionId);
                    }}
                    onRename={(newName) => handleRenameThread(sessionItem.sessionId, newName)}
                    onDelete={handleDeleteThread}
                  />
                ))}
              </div>
            )}
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

function ThreadItem({ session, isActive, onSelect, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name || `Thread`);

  const handleSubmit = (e) => {
    e.stopPropagation();
    onRename(editName);
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditName(session.name || `Thread`);
    setIsEditing(false);
  };

  return (
    <div 
      onClick={onSelect}
      className={`thread-item ${isActive ? 'thread-item-active' : ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <MessageSquare size={12} style={{ flexShrink: 0, opacity: isActive ? 0.8 : 0.4 }} />
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit(e);
              if (e.key === 'Escape') handleCancel(e);
            }}
            className="thread-rename-input"
            autoFocus
          />
        ) : (
          <span className="thread-name">{session.name || `Thread`}</span>
        )}
      </div>

      <div className="thread-actions">
        {isEditing ? (
          <>
            <button 
              onClick={handleSubmit}
              className="thread-action-btn"
              title="Save Name"
            >
              <Check size={10} />
            </button>
            <button 
              onClick={handleCancel}
              className="thread-action-btn"
              title="Cancel"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="thread-action-btn"
              title="Rename Chat"
            >
              <Edit2 size={10} />
            </button>
            <button 
              onClick={(e) => onDelete(session.sessionId, e)}
              className="thread-action-btn"
              style={{ color: '#f87171' }}
              title="Delete Chat"
            >
              <Trash2 size={10} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
