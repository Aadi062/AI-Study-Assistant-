import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, RefreshCw, Settings, Key, Volume2, Mic, Paperclip, AudioLines, PenTool, Globe, Image, Upload, Video, Music, Code } from 'lucide-react';

export default function ChatInterface({ 
  activeVersion, 
  setActiveVersion, 
  onSendMessage, 
  isProcessing, 
  chatHistory, 
  setChatHistory, 
  chatMode, 
  setChatMode,
  isCanvasOpen,
  setIsCanvasOpen,
  canvasTitle,
  setCanvasTitle,
  canvasContent,
  setCanvasContent
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDeepResearchActive, setIsDeepResearchActive] = useState(false);
  const [isGuidedLearningActive, setIsGuidedLearningActive] = useState(false);
  const [isGoogleDrivePickerOpen, setIsGoogleDrivePickerOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttached = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setAttachedFiles(prev => [...prev, ...newAttached]);
    setIsAttachMenuOpen(false);
  };

  const removeAttachedFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };
  const [personalIntelEnabled, setPersonalIntelEnabled] = useState(true);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsAttachMenuOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const toggleAttachMenu = (e) => {
    e.stopPropagation();
    setIsAttachMenuOpen(!isAttachMenuOpen);
    setActiveSubmenu(null);
  };

  const renderAttachPopover = () => {
    if (activeSubmenu === 'uploads') {
      return (
        <div className="more-popover glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: '0', width: '220px', borderRadius: '12px', background: 'rgba(15, 18, 36, 0.96)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', padding: '6px 0', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <button type="button" onClick={() => setActiveSubmenu(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--accent-purple-light)', cursor: 'pointer', fontSize: '11px', textAlign: 'left', fontWeight: 'bold' }}>
            ← Back
          </button>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}></div>
          <button type="button" onClick={() => { setInputValue(inputValue + " [Photos Attachment]"); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%' }}>
            <Image size={13} style={{ opacity: 0.6 }} /> Photos
          </button>
          <button type="button" className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%', opacity: 0.6 }} disabled>
            <BookOpen size={13} style={{ opacity: 0.6 }} /> Avatar
          </button>
          <button type="button" onClick={() => { setInputValue(inputValue + " [Code Attachment]"); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%' }}>
            <Code size={13} style={{ opacity: 0.6 }} /> Import code
          </button>
          <button type="button" className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%', opacity: 0.6 }} disabled>
            <BookOpen size={13} style={{ opacity: 0.6 }} /> Notebooks
          </button>
        </div>
      );
    }

    if (activeSubmenu === 'tools') {
      return (
        <div className="more-popover glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: '0', width: '220px', borderRadius: '12px', background: 'rgba(15, 18, 36, 0.96)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', padding: '6px 0', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <button type="button" onClick={() => setActiveSubmenu(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--accent-purple-light)', cursor: 'pointer', fontSize: '11px', textAlign: 'left', fontWeight: 'bold' }}>
            ← Back
          </button>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}></div>
          <button type="button" onClick={() => { setIsGuidedLearningActive(!isGuidedLearningActive); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%', borderColor: isGuidedLearningActive ? 'var(--accent-emerald)' : 'transparent', background: isGuidedLearningActive ? 'rgba(16,185,129,0.1)' : 'transparent' }}>
            <BookOpen size={13} style={{ color: isGuidedLearningActive ? 'var(--accent-emerald-light)' : '#e2e8f0', opacity: 0.8 }} /> Guided Learning
          </button>
          <div className="popover-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', fontSize: '12px', color: '#e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={13} style={{ color: 'var(--accent-purple-light)' }} />
              <div>
                <div>Personal Intelligence</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Labs</div>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={personalIntelEnabled}
              onChange={() => setPersonalIntelEnabled(!personalIntelEnabled)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="more-popover glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: '0', width: '220px', borderRadius: '12px', background: 'rgba(15, 18, 36, 0.96)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', padding: '6px 0', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
        <button type="button" onClick={() => { fileInputRef.current.click(); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%' }}>
          <Upload size={13} style={{ color: 'var(--text-muted)' }} /> Upload files
        </button>
        <button type="button" onClick={() => { setIsGoogleDrivePickerOpen(true); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%' }}>
          <Globe size={13} style={{ color: 'var(--text-muted)' }} /> Add from Drive
        </button>
        <button type="button" onClick={() => setActiveSubmenu('uploads')} className="popover-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MoreHorizontal size={13} style={{ color: 'var(--text-muted)' }} /> More uploads
          </div>
          <span style={{ fontSize: '9px', opacity: 0.5 }}>▶</span>
        </button>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0' }}></div>
        
        <button type="button" onClick={() => { setInputValue("Create an image of "); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image size={13} style={{ color: 'var(--text-muted)' }} /> Create image
          </div>
          <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '8px', color: 'var(--text-muted)' }}>New</span>
        </button>
        <button type="button" onClick={() => { setInputValue("Create a video of "); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%' }}>
          <Video size={13} style={{ color: 'var(--text-muted)' }} /> Create video
        </button>
        <button type="button" onClick={() => { setInputValue("Create music about "); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Music size={13} style={{ color: 'var(--text-muted)' }} /> Create music
          </div>
          <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '8px', color: 'var(--text-muted)' }}>New</span>
        </button>
        <button type="button" onClick={() => { setIsCanvasOpen(true); setCanvasTitle("Syllabus Notes Draft"); setCanvasContent("Study Syllabus Content Outline:\n\n1. Computer Networks Fundamentals\n2. Key Protocols: TCP, UDP, IP, HTTP\n3. RAG Architecture details\n\n[Use Canvas Actions below to format, improve or edit this draft]"); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%' }}>
          <PenTool size={13} style={{ color: 'var(--text-muted)' }} /> Canvas
        </button>
        <button type="button" onClick={() => { setIsDeepResearchActive(!isDeepResearchActive); setIsAttachMenuOpen(false); }} className="popover-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '12px', width: '100%', borderColor: isDeepResearchActive ? 'var(--accent-purple)' : 'transparent', background: isDeepResearchActive ? 'rgba(168,85,247,0.1)' : 'transparent' }}>
          <Search size={13} style={{ color: isDeepResearchActive ? 'var(--accent-purple-light)' : 'var(--text-muted)' }} /> Deep Research
        </button>
        <button type="button" onClick={() => setActiveSubmenu('tools')} className="popover-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MoreHorizontal size={13} style={{ color: 'var(--text-muted)' }} /> More tools
          </div>
          <span style={{ fontSize: '9px', opacity: 0.5 }}>▶</span>
        </button>
      </div>
    );
  };

  const messagesEndRef = useRef(null);

  const [speakingId, setSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = (text, msgId) => {
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputValue(transcript);
    };
    
    recognition.start();
  };

  const [loadingText, setLoadingText] = useState('Executing playbook...');

  useEffect(() => {
    if (!isProcessing) {
      setLoadingText(chatMode === 'gemini' ? 'Gemini thinking...' : 'Executing playbook...');
      return;
    }
    const agentPhases = [
      '📋 Planner Agent delegating tasks...',
      '🔍 Researcher Agent querying Qdrant DB...',
      '✍️ Writer Agent compiling study resources...'
    ];
    let idx = 0;
    setLoadingText(agentPhases[0]);
    const timer = setInterval(() => {
      idx = (idx + 1) % agentPhases.length;
      setLoadingText(agentPhases[idx]);
    }, 1200);
    return () => clearInterval(timer);
  }, [isProcessing, chatMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing]);

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasAttachments = attachedFiles.length > 0;
    if (!inputValue.trim() && !hasAttachments) return;
    if (isProcessing) return;

    let userMessage = inputValue;
    if (hasAttachments) {
      const fileLabels = attachedFiles.map(f => `📎 **${f.name}** (${f.size})`).join('\n');
      userMessage = `${fileLabels}\n\n${userMessage}`;
    }

    setInputValue('');
    setAttachedFiles([]);

    // Add user message to history
    const newUserMsg = { id: Date.now().toString(), sender: 'student', text: userMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, newUserMsg]);

    // Trigger visualizer animation and fetch reply
    onSendMessage(userMessage, { 
      isDeepResearch: isDeepResearchActive, 
      isGuidedLearning: isGuidedLearningActive 
    });
  };

  const renderInlineMarkdown = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ fontWeight: '700', color: 'white' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMessageContent = (msg) => {
    if (msg.sender === 'student') {
      return <p style={{ fontSize: '12px', lineHeight: '1.5' }}>{renderInlineMarkdown(msg.text)}</p>;
    }

    const isQuiz = msg.text.includes('### Practice Quiz') || msg.text.includes('Q1:') || msg.text.includes('Question 1:');
    
    if (isQuiz) {
      return <QuizParser text={msg.text} />;
    }

    const isFlashcards = msg.text.includes('### Flashcards') || msg.text.includes('Front:') || msg.text.includes('Back:');
    
    if (isFlashcards) {
      return <FlashcardParser text={msg.text} />;
    }

    return (
      <div className="markdown-content" style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {msg.text.split('\n\n').map((para, i) => {
          if (para.startsWith('### ')) {
            return <h3 key={i} style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-purple-light)', marginTop: '4px' }}>{renderInlineMarkdown(para.replace('### ', ''))}</h3>;
          }
          if (para.startsWith('- ') || para.startsWith('* ')) {
            return (
              <ul key={i} style={{ paddingLeft: '16px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {para.split('\n').map((li, j) => {
                  const cleanedLi = li.replace(/^[-*]\s+/, '');
                  return <li key={j}>{renderInlineMarkdown(cleanedLi)}</li>;
                })}
              </ul>
            );
          }
          return <p key={i}>{renderInlineMarkdown(para)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="chat-container">
      {/* Header and Version Selector */}
      <div className="chat-header">
        <div className="chat-header-row">
          <div className="chat-status">
            <div className="chat-status-dot active-pulse"></div>
            <h2 className="chat-title">Study Console</h2>
          </div>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="drawer-close-btn"
            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Gemini API Configurations"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* API Key Panel */}
        {showSettings && (
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={12} style={{ color: 'var(--accent-purple-light)' }} />
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'white' }}>Gemini API Settings</span>
            </div>
            <input
              type="password"
              placeholder="Paste Gemini API Key here..."
              value={apiKey}
              onChange={handleApiKeyChange}
              className="drawer-input"
              style={{ padding: '6px 10px', fontSize: '10px' }}
            />
            <p style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
              Keys are securely stored in your local browser workspace.
            </p>
          </div>
        )}

        {/* Mode Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="mode-toggle-label">Execution Mode:</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            <button
              onClick={() => setChatMode('mock')}
              className={`mode-toggle-btn ${chatMode === 'mock' ? 'mode-toggle-mock' : ''}`}
              style={{ fontSize: '8px', padding: '6px 2px' }}
            >
              Mock SIM
            </button>
            <button
              onClick={() => setChatMode('webhook')}
              className={`mode-toggle-btn ${chatMode === 'webhook' ? 'mode-toggle-live' : ''}`}
              style={{ fontSize: '8px', padding: '6px 2px' }}
            >
              Relay Link
            </button>
            <button
              onClick={() => setChatMode('gemini')}
              className={`mode-toggle-btn ${chatMode === 'gemini' ? 'mode-toggle-mock' : ''}`}
              style={{ fontSize: '8px', padding: '6px 2px', borderColor: chatMode === 'gemini' ? 'var(--accent-blue)' : '', color: chatMode === 'gemini' ? 'var(--accent-blue-light)' : '' }}
            >
              Gemini AI
            </button>
          </div>
        </div>

        {/* Version switcher (Only relevant for Webhook / Mock modes) */}
        {chatMode !== 'gemini' && (
          <div className="version-selector-grid">
            {['88910545', 'ab645045', 'c1c83cdb'].map(id => (
              <button
                key={id}
                onClick={() => setActiveVersion(id)}
                className={`version-card ${activeVersion === id ? 'version-card-active' : ''}`}
              >
                <span className="version-card-title">
                  {activeVersion === id ? '● ' : ''}{id === '88910545' ? 'v1.0' : id === 'ab645045' ? 'v1.1' : 'v1.2'}
                </span>
                <span className="version-card-hash">{id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area">
        {chatHistory.length === 0 && (
          <div className="welcome-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', maxWidth: '600px', margin: '40px auto 0 auto' }}>
            <h2 className="welcome-title" style={{ fontSize: '22px', fontWeight: '500', color: 'white', marginBottom: '8px' }}>
              What's on the agenda today?
            </h2>
            
            {/* Quick Actions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '360px', margin: '8px 0' }}>
              <button 
                type="button"
                onClick={() => setInputValue("Generate a visual comparison chart of ")}
                className="suggestion-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', textAlign: 'left', width: '100%', fontSize: '11px', color: 'var(--text-secondary)' }}
              >
                <Image size={13} style={{ color: 'var(--text-muted)' }} /> Create an image
              </button>
              <button 
                type="button"
                onClick={() => setInputValue("Write an essay summarizing ")}
                className="suggestion-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', textAlign: 'left', width: '100%', fontSize: '11px', color: 'var(--text-secondary)' }}
              >
                <PenTool size={13} style={{ color: 'var(--text-muted)' }} /> Write or edit
              </button>
              <button 
                type="button"
                onClick={() => setInputValue("Search the vector database for ")}
                className="suggestion-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', textAlign: 'left', width: '100%', fontSize: '11px', color: 'var(--text-secondary)' }}
              >
                <Globe size={13} style={{ color: 'var(--text-muted)' }} /> Search the web
              </button>
            </div>

            {/* Quick Suggestions Pilled Grid */}
            <div className="welcome-suggestions" style={{ marginTop: '8px' }}>
              {[
                "Tell me about Photosynthesis process",
                "Explain Newton's Second Law of Motion",
                "Generate a short practice quiz on Cell Structure"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(q)}
                  className="suggestion-pill"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-row ${msg.sender === 'student' ? 'message-student' : 'message-assistant'}`}
          >
            <div className="message-bubble">
              <div className="message-meta">
                <span className="message-sender">
                  {msg.sender === 'student' ? 'Student' : chatMode === 'gemini' ? 'Gemini AI' : 'Study Assistant'}
                </span>
                <span className="message-time" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender === 'assistant' && (
                    <button 
                      type="button"
                      onClick={() => handleSpeak(msg.text, msg.id)}
                      style={{ background: 'none', border: 'none', color: speakingId === msg.id ? 'var(--accent-purple-light)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                      title="Listen to response (Text-to-Speech)"
                    >
                      <Volume2 size={10} className={speakingId === msg.id ? 'active-pulse' : ''} />
                    </button>
                  )}
                </span>
              </div>
              {renderMessageContent(msg)}
              {msg.sender === 'assistant' && msg.agentLogs && (
                <AgentThoughtChain logs={msg.agentLogs} sources={msg.sources} />
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="message-row message-assistant">
            <div className="message-bubble loader-container">
              <div className="loader-dots">
                <span className="loader-dot" style={{ animationDelay: '0ms' }}></span>
                <span className="loader-dot" style={{ animationDelay: '150ms' }}></span>
                <span className="loader-dot" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="loader-text">
                {loadingText}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
        {/* Attached Files Preview Grid */}
        {attachedFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
            {attachedFiles.map(file => (
              <div 
                key={file.id} 
                className="glass-panel animate-fade-in" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', fontSize: '10px', position: 'relative' }}
              >
                {file.previewUrl ? (
                  <img src={file.previewUrl} alt="preview" style={{ width: '16px', height: '16px', borderRadius: '4px', objectFit: 'cover' }} />
                ) : (
                  <span>📄</span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '100px' }}>
                  <span style={{ color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>{file.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>{file.size}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeAttachedFile(file.id)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', padding: 0, marginLeft: '4px' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mode Indicators (Deep Research, Guided Learning) */}
        {(isDeepResearchActive || isGuidedLearningActive) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', width: '100%' }}>
            {isDeepResearchActive && (
              <span className="badge active-pulse" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-purple-light)', border: '1px solid rgba(168,85,247,0.3)', fontSize: '8.5px', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                🌐 Deep Research Active
                <button type="button" onClick={() => setIsDeepResearchActive(false)} style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', cursor: 'pointer', padding: 0, fontSize: '9px', fontWeight: 'bold' }}>✕</button>
              </span>
            )}
            {isGuidedLearningActive && (
              <span className="badge active-pulse" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald-light)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '8.5px', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                📚 Guided Learning Active
                <button type="button" onClick={() => setIsGuidedLearningActive(false)} style={{ background: 'none', border: 'none', color: 'var(--accent-emerald-light)', cursor: 'pointer', padding: 0, fontSize: '9px', fontWeight: 'bold' }}>✕</button>
              </span>
            )}
          </div>
        )}

        <div className="chat-input-wrapper" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={toggleAttachMenu}
              className="drawer-close-btn"
              style={{ padding: '6px', color: isAttachMenuOpen ? 'var(--accent-purple-light)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Attach files & tools"
            >
              <Paperclip size={14} style={{ transform: isAttachMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </button>
            {isAttachMenuOpen && renderAttachPopover()}
          </div>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything..."
            disabled={isProcessing}
            className="chat-input"
          />

          <button
            type="button"
            onClick={handleVoiceInput}
            className={`drawer-close-btn ${isListening ? 'active-pulse' : ''}`}
            style={{ padding: '6px', background: isListening ? 'var(--accent-purple-light)' : 'none', color: isListening ? 'black' : 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Speech to Text (Microphone Dictation)"
          >
            <Mic size={12} />
          </button>

          <button
            type="button"
            className="drawer-close-btn"
            style={{ padding: '6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Voice Mode (Mock)"
          >
            <AudioLines size={14} />
          </button>

          <button
            type="submit"
            disabled={(!inputValue.trim() && attachedFiles.length === 0) || isProcessing}
            className="chat-send-btn"
          >
            <Send size={14} />
          </button>
        </div>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          multiple 
          style={{ display: 'none' }} 
        />
      </form>

      {/* Google Drive Picker */}
      {isGoogleDrivePickerOpen && (
        <div 
          onClick={() => setIsGoogleDrivePickerOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="glass-panel animate-fade-in" 
            style={{ width: '360px', borderRadius: '16px', background: 'rgba(15, 18, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ▲ Google Drive File Picker
              </span>
              <button 
                type="button" 
                onClick={() => setIsGoogleDrivePickerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕
              </button>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '2px 0' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Unit I Syllabus Notes.docx', size: '15.4 KB' },
                { name: 'Biology Lab Manual.pdf', size: '1.2 MB' },
                { name: 'Semester 1 Schedule.xlsx', size: '44.8 KB' },
                { name: 'Photosynthesis Cycle Outline.pptx', size: '240 KB' }
              ].map((file, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setAttachedFiles(prev => [
                      ...prev,
                      { id: Math.random().toString(36).substring(7), name: file.name, size: file.size, type: 'drive', previewUrl: null }
                    ]);
                    setIsGoogleDrivePickerOpen(false);
                  }}
                  className="popover-item"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', fontSize: '11px', color: '#e2e8f0' }}
                >
                  <span>📂 {file.name}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizParser({ text }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const parseQuestions = () => {
    const lines = text.split('\n');
    const questions = [];
    let currentQuestion = null;

    lines.forEach(line => {
      const qMatch = line.match(/^(?:Q\d+|Question \d+):\s*(.*)/i);
      const optMatch = line.match(/^\s*([A-D])\)\s*(.*)/i);
      const ansMatch = line.match(/^Correct Answer:\s*([A-D])/i);

      if (qMatch) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          id: questions.length + 1,
          question: qMatch[1],
          options: [],
          correctAnswer: ''
        };
      } else if (optMatch && currentQuestion) {
        currentQuestion.options.push({
          key: optMatch[1],
          text: optMatch[2]
        });
      } else if (ansMatch && currentQuestion) {
        currentQuestion.correctAnswer = ansMatch[1];
      }
    });
    if (currentQuestion) questions.push(currentQuestion);
    return questions;
  };

  const questions = parseQuestions();

  const handleSelect = (qId, optionKey) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  const score = questions.reduce((acc, q) => {
    return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
  }, 0);

  if (questions.length === 0) {
    return <p style={{ fontSize: '12px' }}>{text}</p>;
  }

  return (
    <div className="quiz-panel">
      <div className="quiz-header">
        <Sparkles size={13} />
        <span>Interactive Quiz</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {questions.map((q) => (
          <div key={q.id} className="quiz-card">
            <p className="quiz-question">Q{q.id}: {q.question}</p>
            <div className="quiz-options-group">
              {q.options.map((opt) => {
                const isSelected = answers[q.id] === opt.key;
                const isCorrect = opt.key === q.correctAnswer;
                
                let optClass = 'quiz-option-btn';
                if (isSelected) optClass += ' quiz-option-selected';
                
                if (submitted) {
                  if (isCorrect) {
                    optClass += ' quiz-option-correct';
                  } else if (isSelected && !isCorrect) {
                    optClass += ' quiz-option-incorrect';
                  } else {
                    optClass += ' quiz-option-faded';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelect(q.id, opt.key)}
                    disabled={submitted}
                    className={optClass}
                  >
                    <span style={{ fontWeight: '700', opacity: 0.5 }}>{opt.key}</span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="quiz-submit-btn"
        >
          Submit Answers
        </button>
      ) : (
        <div className="quiz-results-card">
          <div>
            <span className="quiz-score-label">Score:</span>
            <span className="quiz-score-val">{score} / {questions.length}</span>
          </div>
          <button 
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            className="quiz-reset-btn"
          >
            <RefreshCw size={9} /> Retake
          </button>
        </div>
      )}
    </div>
  );
}

function FlashcardParser({ text }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const parseCards = () => {
    const lines = text.split('\n');
    const cards = [];
    let currentCard = null;

    lines.forEach(line => {
      const frontMatch = line.match(/^Front:\s*(.*)/i);
      const backMatch = line.match(/^Back:\s*(.*)/i);

      if (frontMatch) {
        if (currentCard) cards.push(currentCard);
        currentCard = { front: frontMatch[1], back: '' };
      } else if (backMatch && currentCard) {
        currentCard.back = backMatch[1];
      }
    });
    if (currentCard) cards.push(currentCard);
    return cards.filter(c => c.front && c.back);
  };

  const cards = parseCards();

  if (cards.length === 0) {
    return <p style={{ fontSize: '12px' }}>{text}</p>;
  }

  const current = cards[currentIndex];

  const handleNext = (e) => {
    e.stopPropagation();
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="flashcards-panel">
      <div className="flashcards-header">
        <BookOpen size={13} style={{ color: 'var(--accent-purple-light)' }} />
        <span>Study Flashcards ({currentIndex + 1} / {cards.length})</span>
      </div>

      <div className="flashcard-deck" onClick={() => setFlipped(!flipped)}>
        <div className={`flashcard-card ${flipped ? 'flashcard-flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Concept / Card Front</span>
            <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4' }}>{current.front}</p>
            <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '12px' }}>(Click to Flip)</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(16, 185, 129, 0.6)', marginBottom: '8px' }}>Explanation / Card Back</span>
            <p style={{ margin: 0, fontSize: '10.5px', lineHeight: '1.4' }}>{current.back}</p>
            <span style={{ fontSize: '7.5px', color: 'rgba(16, 185, 129, 0.4)', marginTop: '12px' }}>(Click to Flip)</span>
          </div>
        </div>
      </div>

      <div className="flashcard-nav">
        <button className="flashcard-btn" onClick={handlePrev}>Previous</button>
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <button className="flashcard-btn" onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}

function AgentThoughtChain({ logs, sources }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button 
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', fontSize: '9px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
      >
        <span>{expanded ? '▼ Hide Agent Thought Chain & RAG Info' : '▶ Show Agent Thought Chain & RAG Info'}</span>
      </button>

      {expanded && (
        <div className="animate-fade-in" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {/* Agent Collaboration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Multi-Agent Collaboration Logs:</span>
            {logs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', fontSize: '9px', lineHeight: '1.3' }}>
                <span style={{ color: log.agent.includes('Planner') ? 'var(--accent-purple-light)' : log.agent.includes('Researcher') ? 'var(--accent-blue-light)' : 'var(--accent-emerald-light)', fontWeight: '700', minWidth: '76px' }}>
                  {log.agent.replace(' Agent', '')}:
                </span>
                <span style={{ color: 'var(--text-color)' }}>{log.action}</span>
              </div>
            ))}
          </div>

          {/* RAG Context Sources */}
          {sources && sources.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
              <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Retrieved RAG Context (Database grounding):</span>
              {sources.map((src, idx) => (
                <div key={idx} style={{ fontSize: '8.5px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: '1.3' }}>
                  "{src.length > 180 ? src.slice(0, 180) + '...' : src}"
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
