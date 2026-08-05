import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import LogsDashboard from './components/LogsDashboard';
import { BarChart2, Cpu, Sparkles, MessageSquare, Plus, Edit2, Check, X, Trash2, SquarePen, Image, BookOpen, Globe, Folder, Code, MoreHorizontal, Search, PanelLeftClose, History, FileUp, Sun, Zap, HelpCircle, Mic, Paperclip, LogOut } from 'lucide-react';

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
  const [installedPlugins, setInstalledPlugins] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');
  const [memories, setMemories] = useState(JSON.parse(localStorage.getItem('ai_memories') || '[]'));
  const [newMemory, setNewMemory] = useState('');
  const [customInstructions, setCustomInstructions] = useState(localStorage.getItem('custom_instructions') || '');
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState('Untitled Document');
  const [canvasContent, setCanvasContent] = useState('');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('current_student_user') || 'null'));
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [learningMode, setLearningMode] = useState('standard'); // 'standard' | 'socratic' | 'feynman'
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

  React.useEffect(() => {
    document.body.className = '';
    if (theme !== 'dark') {
      document.body.classList.add(theme + '-theme');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

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
        <button onClick={() => { setActiveModal('activity'); setIsMoreMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <History size={14} style={{ color: 'var(--text-muted)' }} /> Activity
        </button>
        <button onClick={() => { setActiveModal('personal_intel'); setIsMoreMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <Sparkles size={14} style={{ color: 'var(--text-muted)' }} /> Personal Intelligence
        </button>
        <button onClick={() => { setActiveModal('import_memory'); setIsMoreMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <FileUp size={14} style={{ color: 'var(--text-muted)' }} /> Import memory
        </button>
        <button 
          onClick={() => { 
            const themes = ['dark', 'light', 'amethyst'];
            const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
            setTheme(nextTheme);
          }} 
          className="popover-item" 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sun size={14} style={{ color: 'var(--text-muted)' }} /> Theme
          </div>
          <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{theme}</span>
        </button>
        <button onClick={() => { setActiveModal('upgrade'); setIsMoreMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <Zap size={14} style={{ color: 'var(--accent-purple-light)' }} /> Upgrade to AI Ultra
        </button>
        <button onClick={() => { setActiveModal('help'); setIsMoreMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
          <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} /> Help
        </button>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0' }}></div>
        
        <div style={{ padding: '6px 16px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-purple-light)', fontWeight: 'bold' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-purple-light)', display: 'inline-block' }}></span> Vodlemol Cacora, Goa, India
          </div>
          <div style={{ marginTop: '2px' }}>From your IP address</div>
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
  const handleSendMessage = async (userMessage, options = {}) => {
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
          apiKey: localStorage.getItem('gemini_api_key'),
          isDeepResearch: options.isDeepResearch || false,
          isGuidedLearning: options.isGuidedLearning || false,
          learningMode: learningMode
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

  const renderLoginScreen = () => {
    const handleAuthSubmit = (e) => {
      e.preventDefault();
      if (!authUsername.trim()) {
        alert("Please enter a username");
        return;
      }
      const user = { username: authUsername.trim(), isGuest: false };
      setCurrentUser(user);
      localStorage.setItem('current_student_user', JSON.stringify(user));
    };

    const handleGuestLogin = () => {
      const user = { username: 'Guest Student', isGuest: true };
      setCurrentUser(user);
      localStorage.setItem('current_student_user', JSON.stringify(user));
    };

    return (
      <div 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.15) 0%, rgba(15, 18, 36, 1) 70%)',
          color: 'white',
          fontFamily: 'var(--font-sans)',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 100000
        }}
      >
        <div 
          className="glass-panel animate-fade-in" 
          style={{ 
            width: '100%', 
            maxWidth: '380px', 
            padding: '40px 32px', 
            borderRadius: '24px', 
            border: '1px solid rgba(255,255,255,0.08)', 
            background: 'rgba(15, 18, 36, 0.95)', 
            boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 50px rgba(168, 85, 247, 0.1)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* Brand Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6366f1 100%)', 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                boxShadow: '0 0 25px rgba(168,85,247,0.4)' 
              }}
            >
              <Sparkles size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0' }}>Study Console</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Advanced AI Companion for Syllabus Grounding</p>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Username / Email</label>
              <input 
                type="text" 
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="e.g. student001"
                required
                style={{ width: '100%', padding: '12px 14px', fontSize: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', outline: 'none' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Password</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '12px 14px', fontSize: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', outline: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              className="mode-toggle-btn mode-toggle-mock" 
              style={{ width: '100%', padding: '12px', background: 'white', color: 'black', fontWeight: '700', borderRadius: '10px', cursor: 'pointer', marginTop: '4px' }}
            >
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>{authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
              <button 
                type="button" 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }}></div>

            <button 
              type="button" 
              onClick={handleGuestLogin}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsModals = () => {
    if (!activeModal) return null;

    return (
      <div 
        onClick={() => setActiveModal(null)} 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', 
          zIndex: 10000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="glass-panel animate-fade-in" 
          style={{ 
            width: '100%', 
            maxWidth: activeModal === 'upgrade' ? '500px' : '450px', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.08)', 
            background: 'rgba(15, 18, 36, 0.98)', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px' 
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeModal === 'activity' && <History size={16} style={{ color: 'var(--accent-purple-light)' }} />}
              {activeModal === 'personal_intel' && <Sparkles size={16} style={{ color: 'var(--accent-purple-light)' }} />}
              {activeModal === 'import_memory' && <FileUp size={16} style={{ color: 'var(--accent-purple-light)' }} />}
              {activeModal === 'upgrade' && <Zap size={16} style={{ color: 'var(--accent-purple-light)' }} />}
              {activeModal === 'help' && <HelpCircle size={16} style={{ color: 'var(--accent-purple-light)' }} />}
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'white', textTransform: 'capitalize' }}>
                {activeModal === 'personal_intel' ? 'Personal Intelligence Settings' : activeModal.replace('_', ' ')}
              </span>
            </div>
            <button 
              onClick={() => setActiveModal(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '2px 0' }}></div>

          {/* Modal Body */}

          {/* 1. Activity Modal */}
          {activeModal === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Track recent workspace edits, executions, and database changes.</p>
              {[
                { time: 'Just Now', text: 'Opened active Projects & RAG Workspace' },
                { time: '3 mins ago', text: 'Linked images style CARICATURE prompter' },
                { time: '10 mins ago', text: 'Created new study chat session' },
                { time: 'Yesterday', text: 'Completed n8n RAG file upload indexing' },
                { time: '2 days ago', text: 'Successfully pushed master commit to GitHub' }
              ].map((act, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', fontSize: '11px' }}>
                  <span style={{ color: 'white' }}>{act.text}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{act.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* 2. Personal Intelligence Modal */}
          {activeModal === 'personal_intel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Customize default background rules for student chats. These instructions guide assistant logic.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'white' }}>Custom System Rules (Syllabus/Context)</span>
                <textarea 
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    localStorage.setItem('custom_instructions', e.target.value);
                  }}
                  placeholder="Example: Respond using standard computer network definitions. Prefer simple analogies..."
                  rows={6}
                  style={{ width: '100%', padding: '10px', fontSize: '11px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>Labs Personal Intelligence</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Leverage active memory across all threads</div>
                </div>
                <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
              </div>
            </div>
          )}

          {/* 3. Import Memory Modal */}
          {activeModal === 'import_memory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Add persistent context fields. The assistant refers to this memory to adapt explanations to your school curriculum.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  placeholder="e.g. Studying Computer Engineering at Goa University..."
                  style={{ flexGrow: 1, padding: '8px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    if (!newMemory.trim()) return;
                    const updated = [newMemory, ...memories];
                    setMemories(updated);
                    localStorage.setItem('ai_memories', JSON.stringify(updated));
                    setNewMemory('');
                  }}
                  className="mode-toggle-btn mode-toggle-mock" 
                  style={{ fontSize: '11px', padding: '8px 16px' }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {memories.length === 0 ? (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No persistent memory fields saved yet.</span>
                ) : (
                  memories.map((mem, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '11px', color: '#e2e8f0' }}>{mem}</span>
                      <button 
                        onClick={() => {
                          const updated = memories.filter((_, i) => i !== idx);
                          setMemories(updated);
                          localStorage.setItem('ai_memories', JSON.stringify(updated));
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '10px' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. Upgrade Modal */}
          {activeModal === 'upgrade' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
                <Zap size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: '0 0 4px 0' }}>Upgrade to AI Ultra</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                  Unlock double the token limit, advanced multi-agent execution paths, consensus checks, and a visual coding sandbox!
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  alert('Thank you! You are now upgraded to AI Ultra (Mock Mode)!');
                  setActiveModal(null);
                }}
                className="mode-toggle-btn mode-toggle-mock" 
                style={{ width: '100%', padding: '10px 16px', background: 'white', color: 'black', fontWeight: '700', borderRadius: '8px' }}
              >
                Start Free Trial
              </button>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>$20/month. Cancel anytime.</span>
            </div>
          )}

          {/* 5. Help Modal */}
          {activeModal === 'help' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Welcome to the AI Study Assistant! Here are some features to help you get started:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', textAlign: 'left' }}>
                <div>💡 <strong>Interactive Quiz</strong>: Type <em>"give me a quiz on photosynthesis"</em> to get a grading quiz card.</div>
                <div>🎴 <strong>Study Flashcards</strong>: Type <em>"create flashcards for computer networks"</em> to get double-sided flip study cards.</div>
                <div>📂 <strong>RAG Projects</strong>: Scope documents in the Projects tab to make the AI query local reference books.</div>
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                <span style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--accent-purple-light)', fontWeight: '700', display: 'block', marginBottom: '8px', textAlign: 'left' }}>🤖 Intent recognition routing guide</span>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '4px' }}>Query includes</th>
                        <th style={{ padding: '4px' }}>AI action</th>
                        <th style={{ padding: '4px' }}>Routing process</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { trigger: 'image', action: 'Generate an image', process: 'Image Generation' },
                        { trigger: 'flowchart', action: 'Create a flowchart', process: 'Diagram Generation' },
                        { trigger: 'code', action: 'Generate code', process: 'Code Generation' },
                        { trigger: 'ppt', action: 'Create a PowerPoint', process: 'Presentation Generation' },
                        { trigger: 'pdf', action: 'Generate a PDF', process: 'Document Generation' },
                        { trigger: 'docx', action: 'Create a Word document', process: 'Document Generation' },
                        { trigger: 'excel', action: 'Create an Excel sheet', process: 'Spreadsheet Generation' },
                        { trigger: 'csv', action: 'Generate CSV', process: 'Data Export' },
                        { trigger: 'mind map', action: 'Create a mind map', process: 'Mind Map Generation' },
                        { trigger: 'diagram', action: 'Draw a diagram', process: 'Diagram Generation' },
                        { trigger: 'chart', action: 'Create a chart', process: 'Data Visualization' },
                        { trigger: 'graph', action: 'Generate a graph', process: 'Graph Plotting' },
                        { trigger: 'table', action: 'Create a table', process: 'Table Generation' },
                        { trigger: 'sql', action: 'Generate SQL query', process: 'Database Query Generation' },
                        { trigger: 'html', action: 'Generate HTML', process: 'Web Development' },
                        { trigger: 'css', action: 'Generate CSS', process: 'Web Styling' },
                        { trigger: 'javascript', action: 'Generate JavaScript', process: 'Programming' },
                        { trigger: 'python', action: 'Generate Python', process: 'Programming' },
                        { trigger: 'java', action: 'Generate Java', process: 'Programming' },
                        { trigger: 'react', action: 'Generate React component', process: 'Frontend Development' },
                        { trigger: 'api', action: 'Generate API code', process: 'Backend Development' },
                        { trigger: 'json', action: 'Generate JSON', process: 'Data Formatting' },
                        { trigger: 'yaml', action: 'Generate YAML', process: 'Configuration Generation' },
                        { trigger: 'xml', action: 'Generate XML', process: 'Data Formatting' },
                        { trigger: 'email', action: 'Write an email', process: 'Email Generation' },
                        { trigger: 'resume', action: 'Create a resume', process: 'Resume Builder' },
                        { trigger: 'cover letter', action: 'Generate cover letter', process: 'Job Application' },
                        { trigger: 'blog', action: 'Write a blog', process: 'Content Generation' },
                        { trigger: 'story', action: 'Write a story', process: 'Creative Writing' },
                        { trigger: 'poem', action: 'Write a poem', process: 'Creative Writing' },
                        { trigger: 'translate', action: 'Translate text', process: 'Language Translation' },
                        { trigger: 'summarize', action: 'Summarize text', process: 'Text Summarization' },
                        { trigger: 'quiz', action: 'Create quiz questions', process: 'Quiz Generation' },
                        { trigger: 'mcq', action: 'Generate MCQs', process: 'Question Generation' },
                        { trigger: 'notes', action: 'Create notes', process: 'Note Generation' },
                        { trigger: 'roadmap', action: 'Create a roadmap', process: 'Planning' },
                        { trigger: 'project', action: 'Generate project structure', process: 'Project Planning' },
                        { trigger: 'ui', action: 'Design UI', process: 'UI Generation' },
                        { trigger: 'wireframe', action: 'Create wireframe', process: 'UX Design' },
                        { trigger: 'database', action: 'Design database schema', process: 'Database Design' },
                        { trigger: 'erd', action: 'Create ER diagram', process: 'Database Modeling' }
                      ].map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '4px', fontWeight: 'bold', color: 'white' }}>{row.trigger}</td>
                          <td style={{ padding: '4px', color: 'var(--text-secondary)' }}>{row.action}</td>
                          <td style={{ padding: '4px', color: 'var(--accent-purple-light)' }}>{row.process}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '9px', color: 'var(--text-muted)', textAlign: 'left', lineHeight: '1.4', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                <strong>System Taxonomy:</strong> AI Agent • Intent Recognition • Intent Classification • Tool Calling (Tool Use) • AI Routing • Prompt Engineering • Multimodal AI • Agentic AI • Workflow Automation • Function Calling
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return renderLoginScreen();
  }

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
              onClick={() => setActiveTab('images')}
              className={`thread-action-btn ${activeTab === 'images' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Images"
            >
              <Image size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('library')}
              className={`thread-action-btn ${activeTab === 'library' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Library"
            >
              <BookOpen size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('plugins')}
              className={`thread-action-btn ${activeTab === 'plugins' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Plugins"
            >
              <Globe size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('projects')}
              className={`thread-action-btn ${activeTab === 'projects' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Projects Workspace"
            >
              <Folder size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('codex')}
              className={`thread-action-btn ${activeTab === 'codex' ? 'active-icon-btn' : ''}`}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Codex"
            >
              <Code size={16} />
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

              <button 
                onClick={() => setActiveTab('images')}
                className={`nav-btn ${activeTab === 'images' ? 'nav-btn-active' : ''}`}
                style={{ height: '34px', padding: '8px 12px' }}
              >
                <Image size={14} /> Images
              </button>
              <button 
                onClick={() => setActiveTab('library')}
                className={`nav-btn ${activeTab === 'library' ? 'nav-btn-active' : ''}`}
                style={{ height: '34px', padding: '8px 12px' }}
              >
                <BookOpen size={14} /> Library
              </button>
              <button 
                onClick={() => setActiveTab('plugins')}
                className={`nav-btn ${activeTab === 'plugins' ? 'nav-btn-active' : ''}`}
                style={{ height: '34px', padding: '8px 12px' }}
              >
                <Globe size={14} /> Plugins
              </button>
              <button 
                onClick={() => setActiveTab('projects')}
                className={`nav-btn ${activeTab === 'projects' ? 'nav-btn-active' : ''}`}
                style={{ height: '34px', padding: '8px 12px' }}
              >
                <Folder size={14} /> Projects
              </button>
              <button 
                onClick={() => setActiveTab('codex')}
                className={`nav-btn ${activeTab === 'codex' ? 'nav-btn-active' : ''}`}
                style={{ height: '34px', padding: '8px 12px' }}
              >
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

        {/* User Profile Info & Logout */}
        <div style={{ padding: isSidebarCollapsed ? '12px 0' : '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: isSidebarCollapsed ? 'column' : 'row', alignItems: 'center', gap: '10px', marginTop: 'auto' }}>
          <div 
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6366f1 100%)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '11px', 
              fontWeight: 'bold',
              boxShadow: '0 0 10px rgba(168,85,247,0.3)'
            }}
            title={currentUser?.username}
          >
            {currentUser?.username?.substring(0, 2).toUpperCase() || 'ST'}
          </div>
          {!isSidebarCollapsed && (
            <div style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'left' }}>
              {currentUser?.username}
            </div>
          )}
          <button 
            type="button"
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem('current_student_user');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
            title="Log Out"
          >
            <LogOut size={isSidebarCollapsed ? 12 : 13} />
          </button>
        </div>

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
          isCanvasOpen={isCanvasOpen}
          setIsCanvasOpen={setIsCanvasOpen}
          canvasTitle={canvasTitle}
          setCanvasTitle={setCanvasTitle}
          canvasContent={canvasContent}
          setCanvasContent={setCanvasContent}
          learningMode={learningMode}
          setLearningMode={setLearningMode}
        />

        {/* Stage Content Area (Visualizer or Logs Dashboard) or Canvas editor */}
        {isCanvasOpen ? (
          <div className="canvas-container glass-panel animate-slide-in" style={{ flex: 1.5, height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(12, 10, 24, 0.98)', borderLeft: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {/* Canvas Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PenTool size={16} style={{ color: 'var(--accent-purple-light)' }} />
                <input 
                  type="text" 
                  value={canvasTitle} 
                  onChange={(e) => setCanvasTitle(e.target.value)} 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', outline: 'none', borderBottom: '1px dashed rgba(255,255,255,0.1)', padding: '2px 0' }}
                  placeholder="Untitled Document"
                />
              </div>
              <button 
                type="button" 
                onClick={() => setIsCanvasOpen(false)}
                className="thread-action-btn"
                style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Close Canvas"
              >
                <X size={14} />
              </button>
            </div>

            {/* Document Textarea editor */}
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <textarea 
                value={canvasContent}
                onChange={(e) => setCanvasContent(e.target.value)}
                placeholder="Write your essay, curriculum notes, or code here..."
                style={{ width: '100%', flex: 1, padding: '12px', fontSize: '12px', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'white', resize: 'none', outline: 'none', fontFamily: canvasContent.includes('function') || canvasContent.includes('class ') ? 'var(--font-mono)' : 'inherit' }}
              />
            </div>

            {/* AI Assistant Edit Tools */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', width: '100%', marginBottom: '4px' }}>AI Canvas Actions</span>
              <button 
                type="button" 
                onClick={() => {
                  setCanvasContent(prev => prev + "\n\n/* AI Grammar Fix Applied: Corrected syntax alignment and word flow variables. */");
                  setChatHistory(prev => [
                    ...prev,
                    { id: Date.now() + '-s', sender: 'student', text: 'AI, please review and fix typos/grammar in my Canvas document.', timestamp: new Date() },
                    { id: Date.now() + '-a', sender: 'assistant', text: 'I have successfully reviewed your Canvas draft and appended clarifications to the end of the workspace!', timestamp: new Date() }
                  ]);
                }}
                className="mode-toggle-btn mode-toggle-mock" 
                style={{ fontSize: '9px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ✍️ Fix grammar & typos
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setCanvasContent(prev => {
                    const lines = prev.split('\n').filter(l => l.trim() !== '');
                    return lines.map(line => `• ${line.replace(/^•\s*/, '')}`).join('\n');
                  });
                  setChatHistory(prev => [
                    ...prev,
                    { id: Date.now() + '-s', sender: 'student', text: 'AI, format my canvas draft as a bulleted syllabus list.', timestamp: new Date() },
                    { id: Date.now() + '-a', sender: 'assistant', text: 'Format complete. I converted your paragraphs into structured bullet points in the Canvas editor.', timestamp: new Date() }
                  ]);
                }}
                className="mode-toggle-btn mode-toggle-mock" 
                style={{ fontSize: '9px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                📊 Format structure
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setCanvasContent("function runStudyAssistantSimulator() {\n  console.log('Initializing Gemini Study Console...');\n  const model = 'gemini-1.5-pro';\n  const features = ['RAG', 'Visualizer', 'Canvas', 'Plugins'];\n  return `Simulator online using ${model} with ${features.join(', ')}`;\n}");
                  setChatHistory(prev => [
                    ...prev,
                    { id: Date.now() + '-s', sender: 'student', text: 'AI, write a Javascript function to simulate the Study Console.', timestamp: new Date() },
                    { id: Date.now() + '-a', sender: 'assistant', text: 'Done! I have written and formatted the `runStudyAssistantSimulator` template function directly inside your Canvas.', timestamp: new Date() }
                  ]);
                }}
                className="mode-toggle-btn mode-toggle-mock" 
                style={{ fontSize: '9px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                💻 Generate code template
              </button>
            </div>
          </div>
        ) : (
          <div className="stage-content">
          {activeTab === 'visualizer' ? (
            <WorkflowVisualizer 
              activeStep={activeStep}
              executingPath={executingPath}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
            />
          ) : activeTab === 'images' ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Image size={20} style={{ color: 'var(--accent-purple-light)' }} />
                <div>
                  <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '700' }}>Images Generator Workspace</h2>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Create custom illustrations, caricatures, and diagram assets using Gemini Image models.</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}></div>

              {/* Descriptive Prompter */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '8px 16px', alignItems: 'center', maxWidth: '600px', width: '100%', margin: '8px 0 16px 0' }}>
                <Paperclip size={14} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Describe a new image..." 
                  style={{ flexGrow: 1, background: 'none', border: 'none', color: 'white', fontSize: '12px', outline: 'none' }}
                />
                <Mic size={14} style={{ color: 'var(--text-muted)' }} />
                <button type="button" style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>▲</button>
              </div>

              {/* Create an image style cards */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'white', display: 'block', marginBottom: '10px' }}>Create an image style shortcuts</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                  {[
                    { title: 'Create a caricature', desc: 'Cartoon avatar style' },
                    { title: 'Anime', desc: 'Hand-drawn anime style' },
                    { title: 'Underwater', desc: 'Deep ocean atmosphere' },
                    { title: 'Summer list', desc: 'Vibrant outdoor palette' },
                    { title: 'Pin collection', desc: 'Enamel pins and badges' }
                  ].map((card, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '110px', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'transform 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      <span style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>{card.title}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{card.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My generated images */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'white', display: 'block', marginBottom: '10px' }}>My images</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {['Computer Network Nodes Map', 'Photosynthesis Flowchart Diagram', 'Newtonian Physics Simulation Graph', 'Database Schema Relations Map'].map((name, idx) => (
                    <div key={idx} className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)', padding: '10px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '18px' }}>🖼️</div>
                      <span style={{ fontSize: '9px', color: 'white', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'library' ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BookOpen size={20} style={{ color: 'var(--accent-purple-light)' }} />
                  <div>
                    <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '700' }}>Library Workspace</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Browse study files, uploaded documents, and indexed reference books.</p>
                  </div>
                </div>
                {/* Search & Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', cursor: 'pointer' }}
                  >
                    {['All Subjects', 'Computer Networks', 'Database Systems', 'Biology'].map(sub => (
                      <option key={sub} value={sub} style={{ background: '#0e111a', color: 'white' }}>{sub}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Search library..." 
                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '120px', outline: 'none' }}
                  />
                  <button type="button" className="mode-toggle-btn mode-toggle-mock" style={{ fontSize: '11px', padding: '6px 12px', background: 'white', color: 'black' }}>
                    + New
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}></div>

              {/* Pills Filters */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['All', 'Images', 'Documents'].map((pill, idx) => (
                  <span key={idx} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '20px', background: idx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: idx === 0 ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>
                    {pill}
                  </span>
                ))}
              </div>

              {/* Files Table List */}
              <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px', fontWeight: '500' }}>Name</th>
                      <th style={{ padding: '8px 12px', fontWeight: '500' }}>Modified</th>
                      <th style={{ padding: '8px 12px', fontWeight: '500' }}>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Screenshot_2026-07-30-17-14-03-security-center.jpg', date: 'Jul 30, 4:44 AM', size: '97.5 KB', icon: '🖼️', subject: 'Biology' },
                      { name: '1000205719.jpg', date: 'Yesterday', size: '204 KB', icon: '🖼️', subject: 'Biology' },
                      { name: 'Unit I - Introduction to Databases.pdf', date: 'Yesterday', size: '1.76 MB', icon: '📕', subject: 'Database Systems' },
                      { name: 'SE-Unit1.pdf', date: 'Yesterday', size: '1.80 MB', icon: '📕', subject: 'Computer Networks' },
                      { name: 'image-1785420553040.jpg', date: 'Tuesday', size: '340 KB', icon: '🖼️', subject: 'Biology' },
                      { name: 'Professional_Prompt_Engineering_on_21_Slides.pptx', date: 'Jul 25', size: '48.7 KB', icon: '📊', subject: 'Computer Networks' },
                      { name: 'Prompt_Engineering_Practical_Assignment.pptx', date: 'Jul 25', size: '40.7 KB', icon: '📊', subject: 'Computer Networks' },
                      { name: 'image(11).png', date: 'Jul 23', size: '80.7 KB', icon: '🖼️', subject: 'Biology' },
                      { name: 'Dark AI workflow editor interface.png', date: 'Jul 22', size: '1.57 MB', icon: '🖼️', subject: 'Database Systems' },
                      { name: 'AI Study Assistant workflow design(1).png', date: 'Jul 22', size: '1.61 MB', icon: '🖼️', subject: 'Database Systems' }
                    ]
                    .filter(file => selectedSubject === 'All Subjects' || file.subject === selectedSubject)
                    .map((file, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                          <span style={{ fontSize: '13px' }}>{file.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }} title={file.name}>
                            {file.name}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{file.date}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{file.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'plugins' ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Globe size={20} style={{ color: 'var(--accent-purple-light)' }} />
                  <div>
                    <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '700' }}>Plugins Store</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Work with ChatGPT across your favorite productivity, engineering, and design tools.</p>
                  </div>
                </div>
                {/* Search plugins input */}
                <input 
                  type="text" 
                  placeholder="Search plugins..." 
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '180px', outline: 'none' }}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}></div>

              {/* Featured Plugins Grid */}
              {['Featured', 'Productivity', 'Creativity'].map((section, sIdx) => {
                const pluginItems = section === 'Featured' ? [
                  { name: 'Data Analytics', desc: 'Answer product and business questions with charts...' },
                  { name: 'GitHub', desc: 'Triage PRs, issues, CI, and publish flows...' },
                  { name: 'Investment Banking', desc: 'M&A, capital markets, valuation...' },
                  { name: 'Public Equity Investing', desc: 'Public equity PM research, long/short...' },
                  { name: 'Sales', desc: 'Practical workflows for sellers...' },
                  { name: 'Google Drive', desc: 'Work across Drive, Docs, Sheets, and Slides...' }
                ] : section === 'Productivity' ? [
                  { name: 'Notion', desc: 'Notion workflows for specs, research, docs...' },
                  { name: 'Google Calendar', desc: 'Manage Google Calendar events...' },
                  { name: 'Linear', desc: 'Plan and build products...' },
                  { name: 'ClickUp', desc: 'Turn Codex into your ClickUp command center...' },
                  { name: 'Dropbox', desc: 'Access, save and share files...' },
                  { name: 'Asana', desc: 'Turn chats into actions...' }
                ] : [
                  { name: 'Canva', desc: 'Create, review, edit designs...' },
                  { name: 'Figma', desc: 'Design-to-code workflows powered by Figma...' },
                  { name: 'Gamma', desc: 'Create presentations and docs...' },
                  { name: 'Descript', desc: 'Edit video by chatting...' },
                  { name: 'Adobe Photoshop', desc: 'Design, combine, and edit images...' },
                  { name: 'Product Design', desc: 'Explore and prototype ideas...' }
                ];

                return (
                  <div key={sIdx} style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'white', display: 'block', marginBottom: '8px' }}>{section}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {pluginItems.map((plugin, pIdx) => {
                        const isInstalled = installedPlugins.includes(plugin.name);
                        return (
                          <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '80%' }}>
                              <div style={{ fontSize: '16px' }}>🔌</div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>{plugin.name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plugin.desc}</div>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                if (isInstalled) {
                                  setInstalledPlugins(installedPlugins.filter(p => p !== plugin.name));
                                } else {
                                  setInstalledPlugins([...installedPlugins, plugin.name]);
                                }
                              }}
                              style={{ border: 'none', background: isInstalled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)', color: isInstalled ? 'var(--accent-emerald-light)' : 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}
                            >
                              {isInstalled ? '✓' : '+'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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

              {/* Subject folder scope selector */}
              <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'white' }}>Vector Database Subject Scope</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Any new documents indexed will be bound to this subject directory.</span>
                </div>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {['All Subjects', 'Computer Networks', 'Database Systems', 'Biology'].map(sub => (
                    <option key={sub} value={sub} style={{ background: '#0e111a', color: 'white' }}>{sub}</option>
                  ))}
                </select>
              </div>

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
          ) : activeTab === 'codex' ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '40px 24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'rgba(15, 18, 36, 0.5)', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflowY: 'auto' }}>
              {/* Codex Logo Sparkle */}
              <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 40px rgba(168,85,247,0.3)' }}>
                <Code size={36} />
              </div>
              
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-sans)', color: 'white', margin: '0 0 10px 0' }}>Codex</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto', lineHeight: '1.6' }}>
                  The same powerful coding agent—now in ChatGPT. Access automated codebase refactoring, live repository browsing, and package compiling checks natively.
                </p>
              </div>

              {/* Download Action button */}
              <button 
                type="button" 
                className="mode-toggle-btn mode-toggle-mock" 
                style={{ fontSize: '12px', padding: '10px 24px', background: 'white', color: 'black', fontWeight: 'bold', borderRadius: '24px', boxShadow: '0 4px 15px rgba(255,255,255,0.1)' }}
              >
                Download for Windows
              </button>

              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)', width: '100%', maxWidth: '500px', paddingTop: '16px' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '14px', fontWeight: '700' }}>Trusted by top teams</span>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.6 }}>
                  {['NVIDIA', 'AMGEN', 'CISCO', 'SHOPIFY', 'THOMSON REUTERS'].map((team, idx) => (
                    <span key={idx} style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#e2e8f0' }}>{team}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <LogsDashboard executions={executions} />
          )}
        </div>
      )}
    </div>
      {renderSettingsModals()}
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
