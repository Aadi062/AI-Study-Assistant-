import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import LogsDashboard from './components/LogsDashboard';
import { BarChart2, Cpu, Sparkles, MessageSquare, Plus, Edit2, Check, X, Trash2, SquarePen, Image, BookOpen, Globe, Folder, Code, MoreHorizontal, Search, PanelLeftClose, History, FileUp, Sun, Zap, HelpCircle } from 'lucide-react';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

  React.useEffect(() => {
    const handleDocumentClick = () => {
      setIsMoreMenuOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const toggleMoreMenu = (e) => {
    e.stopPropagation();
    setIsMoreMenuOpen(!isMoreMenuOpen);
  };

  const renderMorePopover = (isCollapsed) => {
    return (
      <div 
        className="more-popover glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: '100%',
          left: isCollapsed ? '50px' : '0',
          marginBottom: '8px',
          width: '240px',
          zIndex: 999,
          borderRadius: '12px',
          background: 'rgba(15, 18, 36, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-secondary)'
        }}
      >
        <button className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <History size={14} style={{ color: 'var(--text-muted)' }} /> Activity
        </button>
        <button className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <Sparkles size={14} style={{ color: 'var(--text-muted)' }} /> Personal Intelligence
        </button>
        <button className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <FileUp size={14} style={{ color: 'var(--text-muted)' }} /> Import memory
        </button>
        <button className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <Sun size={14} style={{ color: 'var(--text-muted)' }} /> Theme
        </button>
        <button className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <Zap size={14} style={{ color: 'var(--accent-purple-light)' }} /> Upgrade to AI Ultra
        </button>
        <button className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} /> Help
        </button>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0' }}></div>
        
        <div style={{ padding: '6px 16px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-purple-light)' }}>
            <span style={{ fontSize: '12px' }}>•</span> Vodlemol Cacora, Goa, India
          </div>
          <div>From your IP address</div>
        </div>
      </div>
    );
  };

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
      <div className={`sidebar glass-panel ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {isSidebarCollapsed ? (
          <div className="sidebar-collapsed-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', height: '100%', width: '100%' }}>
            {/* Gemini Sparkle Logo */}
            <div className="brand-logo" style={{ marginTop: '8px' }}>
              <Sparkles size={18} />
            </div>
            
            {/* Sidebar Toggle Expand button */}
            <button 
              onClick={() => setIsSidebarCollapsed(false)}
              className="thread-action-btn" 
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}
              title="Expand Sidebar"
            >
              <PanelLeftClose size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', width: '100%', margin: '4px 0' }}></div>

            {/* Quick Icons */}
            <button 
              onClick={handleCreateNewThread}
              className="thread-action-btn" 
              style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%', 
                border: '1.5px dashed rgba(255,255,255,0.3)', 
                background: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '0',
                transition: 'border-color 0.15s ease'
              }}
              title="New chat"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple-light)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            >
              <SquarePen size={12} style={{ color: '#e2e8f0' }} />
            </button>

            <button 
              onClick={() => setActiveTab('visualizer')}
              className={`thread-action-btn ${activeTab === 'visualizer' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Playbook Visualizer"
            >
              <Cpu size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('logs')}
              className={`thread-action-btn ${activeTab === 'logs' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Run Executions"
            >
              <BarChart2 size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('projects')}
              className={`thread-action-btn ${activeTab === 'projects' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Projects Workspace"
            >
              <Folder size={16} />
            </button>
            
            <div style={{ flexGrow: 1 }}></div>

            {/* Help / Settings */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={toggleMoreMenu}
                className="thread-action-btn" 
                title="More options" 
                style={{ opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <MoreHorizontal size={16} />
              </button>
              {isMoreMenuOpen && renderMorePopover(true)}
            </div>
          </div>
        ) : (
          <div className="sidebar-top">
            {/* Logo Brand */}
            <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="brand-logo">
                  <Sparkles size={18} />
                </div>
                <div className="brand-info">
                  <h1 className="gradient-text">AI study</h1>
                  <span>Study Assistant UI</span>
                </div>
              </div>
              {/* Header Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <button className="thread-action-btn" title="Search"><Search size={14} /></button>
                <button 
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="thread-action-btn" 
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="nav-group">
              <button
                onClick={handleCreateNewThread}
                className="nav-btn"
                style={{ 
                  background: 'rgba(168, 85, 247, 0.05)', 
                  border: '1px solid rgba(168, 85, 247, 0.12)',
                  color: 'var(--accent-purple-light)',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}
              >
                <SquarePen size={16} /> New chat
              </button>

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

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '8px 0' }}></div>

              <button className="nav-btn" style={{ opacity: 0.6, cursor: 'not-allowed', height: '34px', padding: '8px 12px' }} disabled>
                <Image size={14} /> Images
              </button>
              <button className="nav-btn" style={{ opacity: 0.6, cursor: 'not-allowed', height: '34px', padding: '8px 12px' }} disabled>
                <BookOpen size={14} /> Library
              </button>
              <button className="nav-btn" style={{ opacity: 0.6, cursor: 'not-allowed', height: '34px', padding: '8px 12px' }} disabled>
                <Globe size={14} /> Plugins
              </button>
              <button 
                onClick={() => setActiveTab('projects')}
                className={`nav-btn ${activeTab === 'projects' ? 'nav-btn-active' : ''}`}
                style={{ height: '34px', padding: '8px 12px' }}
              >
                <Folder size={14} /> Projects
              </button>
              <button className="nav-btn" style={{ opacity: 0.6, cursor: 'not-allowed', height: '34px', padding: '8px 12px' }} disabled>
                <Code size={14} /> Codex
              </button>
              <div style={{ position: 'relative', width: '100%' }}>
                <button 
                  onClick={toggleMoreMenu}
                  className="nav-btn" 
                  style={{ height: '34px', padding: '8px 12px', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <MoreHorizontal size={14} /> More
                </button>
                {isMoreMenuOpen && renderMorePopover(false)}
              </div>
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
        )}

        {/* Footer details */}
        {!isSidebarCollapsed && (
          <div className="sidebar-footer">
            <div>OS: WINDOWS</div>
            <div>PROJECT: STUDY-ASSISTANT</div>
            <div style={{ color: 'var(--accent-purple-light)' }}>TARGET: 3 VERSIONS</div>
          </div>
        )}
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
            <WorkflowVisualizer 
              activeStep={activeStep}
              executingPath={executingPath}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
            />
          ) : activeTab === 'projects' ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Folder size={20} style={{ color: 'var(--accent-purple-light)' }} />
                <div>
                  <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '700' }}>Projects Workspace & RAG Ingestion</h2>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Manage curriculum files, index syllabus notes, and upload research text into the vector database.</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'white' }}>Index New Textbook/Syllabus Document</span>
                <textarea 
                  placeholder="Paste syllabus guidelines, textbook chapters, or reference materials here to index them..."
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  rows={8}
                  style={{ width: '100%', padding: '12px', fontSize: '11px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <button 
                    onClick={handleIngestDocument}
                    disabled={isIngesting || !ingestText.trim()}
                    className="mode-toggle-btn mode-toggle-mock"
                    style={{ fontSize: '11px', padding: '8px 16px', opacity: (isIngesting || !ingestText.trim()) ? 0.6 : 1 }}
                  >
                    {isIngesting ? 'Processing & Indexing Vector DB...' : 'Upload & Index to Vector DB'}
                  </button>
                  {ingestStatus && <span style={{ fontSize: '11px', color: ingestStatus.includes('Error') ? 'var(--accent-coral-light)' : 'var(--accent-emerald-light)' }}>{ingestStatus}</span>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '16px 0 8px 0' }}></div>

              {/* Indexed Files List */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'white', display: 'block', marginBottom: '10px' }}>Active Curriculum Sources in Vector Database</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'Computer Networks - Course Curriculum Outline', size: '12.4 KB', chunks: '8 chunks' },
                    { name: 'Photosynthesis Mechanism & Cellular Biology Guide', size: '24.1 KB', chunks: '15 chunks' },
                    { name: 'Newtonian Physics & Laws of Mechanics', size: '8.8 KB', chunks: '5 chunks' }
                  ].map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Folder size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '11px', color: '#e2e8f0' }}>{doc.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.chunks}</span>
                      </div>
                    </div>
                  ))}
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
