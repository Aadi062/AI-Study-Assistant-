import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, RefreshCw, Settings, Key, Volume2, Mic } from 'lucide-react';

export default function ChatInterface({ activeVersion, setActiveVersion, onSendMessage, isProcessing, chatHistory, setChatHistory, chatMode, setChatMode }) {
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
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
    if (!inputValue.trim() || isProcessing) return;
    
    const userMessage = inputValue;
    setInputValue('');
    
    // Add user message to history
    const newUserMsg = { id: Date.now().toString(), sender: 'student', text: userMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, newUserMsg]);
    
    // Trigger visualizer animation and fetch reply
    onSendMessage(userMessage);
  };

  const renderMessageContent = (msg) => {
    if (msg.sender === 'student') {
      return <p style={{ fontSize: '12px', lineHeight: '1.5' }}>{msg.text}</p>;
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
            return <h3 key={i} style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-purple-light)', marginTop: '4px' }}>{para.replace('### ', '')}</h3>;
          }
          if (para.startsWith('**') && para.endsWith('**')) {
            return <p key={i} style={{ fontWeight: '700', color: 'white' }}>{para.replaceAll('**', '')}</p>;
          }
          if (para.startsWith('- ')) {
            return (
              <ul key={i} style={{ paddingLeft: '16px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {para.split('\n').map((li, j) => (
                  <li key={j}>{li.replace('- ', '')}</li>
                ))}
              </ul>
            );
          }
          return <p key={i}>{para}</p>;
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
          <div className="welcome-box">
            <div className="welcome-icon-wrapper">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="welcome-title">Start your Study Session</h3>
              <p className="welcome-desc">
                {chatMode === 'gemini' 
                  ? 'Chat with the live Google Gemini model. Enter syllabus queries or request multiple-choice quizzes!'
                  : 'Ask a question about the curriculum, request a quiz, or ask for clarifications.'}
              </p>
            </div>
            <div className="welcome-suggestions">
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
      <form onSubmit={handleSubmit} className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={chatMode === 'gemini' ? "Chat with Gemini AI..." : "Ask your question here..."}
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
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="chat-send-btn"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
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
