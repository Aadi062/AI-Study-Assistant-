import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, RefreshCw, Settings, Key, Volume2, Mic, Paperclip, AudioLines, PenTool, Globe, Image, Upload, Video, Music, Code, Download } from 'lucide-react';

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
  setCanvasContent,
  learningMode,
  setLearningMode
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

  const handleExportChat = () => {
    if (chatHistory.length <= 1) {
      alert("No conversation history to export yet.");
      return;
    }
    
    let mdContent = `# AI Study Assistant Chat Session - ${new Date().toLocaleDateString()}\n\n`;
    chatHistory.forEach(msg => {
      const roleName = msg.sender === 'student' ? 'Student' : 'AI Study Assistant';
      const timeStr = new Date(msg.timestamp).toLocaleTimeString();
      mdContent += `### [${timeStr}] ${roleName}\n${msg.text}\n\n`;
      if (msg.sources && msg.sources.length > 0) {
        mdContent += `**Retrieved Grounding Sources**:\n${msg.sources.join('\n')}\n\n`;
      }
      mdContent += `---\n\n`;
    });
    
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `study_session_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    const isMermaid = msg.text.includes('```mermaid') || msg.text.includes('mindmap') || msg.text.includes('flowchart');
    
    if (isMermaid) {
      return <MermaidParser text={msg.text} />;
    }

    const isPresentation = msg.text.includes('[Presentation]');
    if (isPresentation) return <PresentationCard text={msg.text} />;

    const isSpreadsheet = msg.text.includes('[Spreadsheet]');
    if (isSpreadsheet) return <SpreadsheetCard text={msg.text} />;

    const isRoadmap = msg.text.includes('[Roadmap]');
    if (isRoadmap) return <RoadmapCard text={msg.text} />;

    const isErd = msg.text.includes('[ERD]');
    if (isErd) return <ErdCard text={msg.text} />;

    const isChart = msg.text.includes('[Chart]');
    if (isChart) return <ChartCard text={msg.text} />;

    const isImage = msg.text.includes('[Image:');
    if (isImage) {
      const imgMatch = msg.text.match(/\[Image:\s*([^\]]+)\]/i);
      const imgSrc = imgMatch ? imgMatch[1].trim() : '';
      return <ImageCard src={`/${imgSrc}`} text={msg.text} />;
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              type="button"
              onClick={handleExportChat}
              className="drawer-close-btn"
              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Export Conversation to Markdown"
            >
              <Download size={13} />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="drawer-close-btn"
              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Gemini API Configurations"
            >
              <Settings size={14} />
            </button>
          </div>
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

        {/* Learning Style Mode Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
          <span className="mode-toggle-label">Learning Mode:</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            <button
              onClick={() => setLearningMode('standard')}
              className={`mode-toggle-btn ${learningMode === 'standard' ? 'mode-toggle-mock' : ''}`}
              style={{ fontSize: '8px', padding: '6px 2px' }}
            >
              Standard
            </button>
            <button
              onClick={() => setLearningMode('socratic')}
              className={`mode-toggle-btn ${learningMode === 'socratic' ? 'mode-toggle-mock' : ''}`}
              style={{ fontSize: '8px', padding: '6px 2px', borderColor: learningMode === 'socratic' ? 'var(--accent-purple-light)' : '', color: learningMode === 'socratic' ? 'var(--accent-purple-light)' : '' }}
            >
              🎓 Socratic
            </button>
            <button
              onClick={() => setLearningMode('feynman')}
              className={`mode-toggle-btn ${learningMode === 'feynman' ? 'mode-toggle-mock' : ''}`}
              style={{ fontSize: '8px', padding: '6px 2px', borderColor: learningMode === 'feynman' ? 'var(--accent-emerald-light)' : '', color: learningMode === 'feynman' ? 'var(--accent-emerald-light)' : '' }}
            >
              🔬 Feynman
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

function MermaidParser({ text }) {
  const mermaidMatch = text.match(/```mermaid([\s\S]*?)```/);
  const code = mermaidMatch ? mermaidMatch[1] : '';
  const textClean = text.replace(/```mermaid[\s\S]*?```/g, '').trim();

  if (!code) {
    return <p style={{ fontSize: '12px', lineHeight: '1.5' }}>{text}</p>;
  }

  const lines = code.split('\n').filter(l => l.trim() !== '' && !l.includes('mindmap') && !l.includes('flowchart'));
  
  let rootNode = 'Mind Map';
  const children = [];

  lines.forEach(line => {
    const depth = line.search(/\S/);
    const cleanLine = line.trim().replace(/[()[\]{}@]/g, '');
    if (depth === 0 || depth === 2) {
      rootNode = cleanLine;
    } else {
      children.push(cleanLine);
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {textClean && <p style={{ fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{textClean}</p>}
      
      <div 
        className="glass-panel" 
        style={{ 
          background: 'rgba(0,0,0,0.3)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px',
          overflow: 'hidden'
        }}
      >
        <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-purple-light)' }}>
          📊 Study Mind Map
        </span>
        
        <svg width="100%" height="160" viewBox="0 0 320 160" style={{ overflow: 'visible' }}>
          {children.map((child, idx) => {
            const xVal = 40 + (idx * (240 / Math.max(1, children.length - 1)));
            return (
              <g key={idx}>
                <path 
                  d={`M 160 30 Q ${160 + (xVal - 160)/2} 75, ${xVal} 115`}
                  fill="none" 
                  stroke="rgba(168, 85, 247, 0.4)" 
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </g>
            );
          })}

          <g transform="translate(160, 30)">
            <rect 
              x="-65" 
              y="-15" 
              width="130" 
              height="30" 
              rx="15" 
              fill="var(--accent-purple)"
              style={{ filter: 'drop-shadow(0px 0px 8px rgba(168,85,247,0.4))' }}
            />
            <text 
              fill="white" 
              fontSize="9" 
              fontWeight="bold" 
              textAnchor="middle" 
              y="4"
            >
              {rootNode.length > 20 ? rootNode.substring(0, 18) + '...' : rootNode}
            </text>
          </g>

          {children.map((child, idx) => {
            const xVal = 40 + (idx * (240 / Math.max(1, children.length - 1)));
            return (
              <g key={idx} transform={`translate(${xVal}, 125)`}>
                <rect 
                  x="-35" 
                  y="-12" 
                  width="70" 
                  height="24" 
                  rx="6" 
                  fill="rgba(255,255,255,0.06)" 
                  stroke="rgba(255,255,255,0.15)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => alert(`Sub-concept topic: "${child}"`)}
                />
                <text 
                  fill="rgba(255,255,255,0.9)" 
                  fontSize="8" 
                  textAnchor="middle" 
                  y="3"
                  style={{ pointerEvents: 'none' }}
                >
                  {child.length > 12 ? child.substring(0, 10) + '..' : child}
                </text>
              </g>
            );
          })}
        </svg>
        
        <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
          💡 Click sub-nodes to inspect topic relations
        </span>
      </div>
    </div>
  );
}

// 1. Presentation Slide Deck Carousel Card
function PresentationCard({ text }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const cleanText = text.replace(/\[Presentation\][\s\S]*$/i, '').trim();
  const slidesBlock = text.split('[Presentation]')[1] || '';
  const slideRegex = /Slide\s+\d+:\s*([^\n]+)\n((?:-\s*[^\n]+\n?)*)/gi;
  const slides = [];
  let match;
  while ((match = slideRegex.exec(slidesBlock)) !== null) {
    const title = match[1].trim();
    const bullets = match[2].split('\n').map(b => b.replace(/^-\s*/, '').trim()).filter(b => b !== '');
    slides.push({ title, bullets });
  }

  if (slides.length === 0) {
    return <p style={{ fontSize: '12px' }}>{text}</p>;
  }

  const nextSlide = () => setActiveSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {cleanText && <p style={{ fontSize: '12px', margin: 0 }}>{cleanText}</p>}
      
      <div className="glass-panel" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', height: '165px', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '8px', color: 'var(--accent-purple-light)', fontWeight: '800', textTransform: 'uppercase' }}>💻 Slide Presentation</span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Slide {activeSlide + 1} of {slides.length}</span>
          </div>

          <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'white', margin: '0 0 10px 0' }}>{slides[activeSlide]?.title}</h4>
          
          <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '10.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6' }}>
            {slides[activeSlide]?.bullets.map((bullet, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{bullet}</li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
          <button type="button" onClick={prevSlide} style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', cursor: 'pointer' }}>Prev</button>
          <button type="button" onClick={nextSlide} style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', cursor: 'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  );
}

// 2. Spreadsheet Excel Grid Card
function SpreadsheetCard({ text }) {
  const cleanText = text.replace(/\[Spreadsheet\][\s\S]*$/i, '').trim();
  const csvBlock = text.split('[Spreadsheet]')[1] || '';
  const lines = csvBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  if (lines.length === 0) {
    return <p style={{ fontSize: '12px' }}>{text}</p>;
  }

  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(row => row.split(','));

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(csvBlock.trim());
    alert("CSV copied to clipboard!");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {cleanText && <p style={{ fontSize: '12px', margin: 0 }}>{cleanText}</p>}
      
      <div className="glass-panel" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '8px', color: 'var(--accent-emerald-light)', fontWeight: '800', textTransform: 'uppercase' }}>📊 Spreadsheet Workbook</span>
          <button type="button" onClick={handleCopyCsv} style={{ background: 'none', border: 'none', color: 'var(--accent-emerald-light)', cursor: 'pointer', fontSize: '8.5px', fontWeight: 'bold' }}>Copy CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                {headers.map((h, i) => <th key={i} style={{ padding: '6px' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.9)' }}>
                  {row.map((cell, cIdx) => <td key={cIdx} style={{ padding: '6px' }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 3. Roadmap Planner Card
function RoadmapCard({ text }) {
  const cleanText = text.replace(/\[Roadmap\][\s\S]*$/i, '').trim();
  const listBlock = text.split('[Roadmap]')[1] || '';
  const items = listBlock.split('\n').map(l => l.trim()).filter(l => l !== '').map(l => {
    const parts = l.split('|');
    return { name: parts[0], done: parts[1] === 'done' };
  });

  if (items.length === 0) {
    return <p style={{ fontSize: '12px' }}>{text}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {cleanText && <p style={{ fontSize: '12px', margin: 0 }}>{cleanText}</p>}
      
      <div className="glass-panel" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
        <span style={{ fontSize: '8px', color: 'var(--accent-purple-light)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>📈 Interactive Learning Roadmap</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: item.done ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 'bold' }}>
                {item.done ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: '10.5px', color: item.done ? 'var(--text-muted)' : '#e2e8f0', textDecoration: item.done ? 'line-through' : 'none' }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. ERD Schema Card
function ErdCard({ text }) {
  const cleanText = text.replace(/\[ERD\][\s\S]*$/i, '').trim();
  const erdBlock = text.split('[ERD]')[1] || '';
  const tables = erdBlock.split('\n').map(l => l.trim()).filter(l => l !== '').map(l => {
    const nameMatch = l.match(/Table:\s*([^\s|]+)/i);
    const pkMatch = l.match(/PK:\s*([^\s|]+)/i);
    const fieldsMatch = l.match(/Fields:\s*(.*)/i);
    return {
      name: nameMatch ? nameMatch[1] : 'Table',
      pk: pkMatch ? pkMatch[1] : 'id',
      fields: fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim()) : []
    };
  });

  if (tables.length === 0) {
    return <p style={{ fontSize: '12px' }}>{text}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {cleanText && <p style={{ fontSize: '12px', margin: 0 }}>{cleanText}</p>}
      
      <div className="glass-panel" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '8px', color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>🗄️ Database ERD Schema</span>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {tables.map((table, idx) => (
            <div key={idx} className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px', fontSize: '9px', textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', marginBottom: '6px' }}>🔑 {table.name}</div>
              <div style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '3px' }}>🔑 {table.pk} (PK)</div>
              {table.fields.map((f, fIdx) => (
                <div key={fIdx} style={{ color: 'var(--text-secondary)' }}>• {f}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5. Chart Visualizer Card
function ChartCard({ text }) {
  const cleanText = text.replace(/\[Chart\][\s\S]*$/i, '').trim();
  const chartBlock = text.split('[Chart]')[1] || '';
  const labelLine = chartBlock.split('\n').find(l => l.includes('Labels:')) || '';
  const valLine = chartBlock.split('\n').find(l => l.includes('Values:')) || '';
  
  const labels = labelLine.replace(/Labels:\s*/i, '').split(',').map(l => l.trim());
  const values = valLine.replace(/Values:\s*/i, '').split(',').map(v => parseInt(v.trim()) || 0);

  if (labels.length === 0 || values.length === 0) {
    return <p style={{ fontSize: '12px' }}>{text}</p>;
  }

  const maxValue = Math.max(...values, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {cleanText && <p style={{ fontSize: '12px', margin: 0 }}>{cleanText}</p>}
      
      <div className="glass-panel" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '8px', color: 'var(--accent-purple-light)', fontWeight: '800', textTransform: 'uppercase', alignSelf: 'flex-start' }}>📈 Data Graph Visualizer</span>
        
        <svg width="100%" height="110" viewBox="0 0 280 110" style={{ overflow: 'visible' }}>
          {values.map((val, idx) => {
            const barHeight = (val / maxValue) * 80;
            const xPos = 30 + (idx * 50);
            return (
              <g key={idx}>
                <rect 
                  x={xPos - 12} 
                  y={90 - barHeight} 
                  width="24" 
                  height={barHeight} 
                  rx="4" 
                  fill="url(#barGrad)"
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onClick={() => alert(`Value: ${val}`)}
                />
                <text x={xPos} y={85 - barHeight} fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">{val}</text>
                <text x={xPos} y="104" fill="var(--text-muted)" fontSize="7" textAnchor="middle">{labels[idx]}</text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-purple)" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// 6. Image Generation Visualizer Card
function ImageCard({ src, text }) {
  const cleanText = text.replace(/\[Image:\s*([^\]]+)\]/gi, '').trim();
  const isCivic = src.includes('media__1785690174675');
  const isRaceCars = src.includes('media__1785423992568');
  
  let imgStyle = { width: '100%', height: 'auto', display: 'block', borderRadius: '8px' };
  let containerStyle = { width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' };
  let subtitle = 'Custom Modified Sports Car Build';

  if (isCivic) {
    containerStyle = { ...containerStyle, height: '180px', position: 'relative' };
    imgStyle = { position: 'absolute', left: '-10px', top: '-135px', width: '540px', height: 'auto', display: 'block' };
    subtitle = 'Ultimate Track Build Speed & Performance';
  } else if (isRaceCars) {
    containerStyle = { ...containerStyle, height: '180px', position: 'relative' };
    imgStyle = { position: 'absolute', left: '-515px', top: '-340px', width: '800px', height: 'auto', display: 'block' };
    subtitle = 'Supra Mk5 / GT-R R35 Speed Circuit Build';
  } else {
    containerStyle = { ...containerStyle, height: 'auto' };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {cleanText && <p style={{ fontSize: '12px', margin: 0 }}>{cleanText}</p>}
      
      <div 
        className="glass-panel" 
        style={{ 
          background: 'rgba(0, 0, 0, 0.4)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '16px', 
          padding: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        <span style={{ fontSize: '8px', color: 'var(--accent-purple-light)', fontWeight: '800', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
          🖼️ AI Generated Illustration
        </span>
        <div style={containerStyle}>
          <img src={src} alt="AI Generated Illustration" style={imgStyle} />
        </div>
        <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      </div>
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
