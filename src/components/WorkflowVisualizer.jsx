import React, { useState } from 'react';
import { 
  Webhook, HelpCircle, Database, Cpu, HardDrive, 
  Repeat, FileText, Scissors, AlertCircle, X, Copy, Check, ChevronRight 
} from 'lucide-react';

export default function WorkflowVisualizer({ activeStep, selectedNode, setSelectedNode }) {
  const [activeWorkflow, setActiveWorkflow] = useState('chat'); // 'chat' | 'indexer' | 'uploader'
  const [copiedText, setCopiedText] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // ----------------------------------------------------
  // WORKFLOW 1: AI Chat Agent (Screenshot 2)
  // ----------------------------------------------------
  const chatWorkflowNodes = [
    {
      id: 'chat-webhook',
      type: 'trigger',
      title: 'Webhook',
      desc: 'Starts on POST request',
      icon: <Webhook size={16} />,
      details: {
        title: 'Webhook Trigger Node',
        type: 'n8n Webhook',
        url: 'https://n8n.workspace.local/webhook/ai-study-assistant',
        configs: [
          { label: 'HTTP Method', value: 'POST' },
          { label: 'Response Mode', value: 'On Received / Custom' }
        ]
      }
    },
    {
      id: 'chat-agent',
      type: 'agent',
      title: 'AI Study Assistant',
      desc: 'n8n Advanced AI Agent',
      icon: <Cpu size={16} />,
      details: {
        title: 'AI Study Assistant (Agent)',
        type: 'AI Agent Node',
        agentType: 'Tools Agent',
        prompt: 'You are the AI Study Assistant. Retrieve context from Qdrant Vector Store to ground answers. If the student asks for practice, trigger the generate_student_quiz tool.',
        configs: [
          { label: 'System Model', value: 'Connected (Groq/Llama-3)' },
          { label: 'Memory type', value: 'Window Buffer Memory' }
        ]
      }
    },
    {
      id: 'chat-model',
      type: 'sub-node',
      title: 'Groq Chat Model',
      desc: 'Llama-3-70b-Versatile',
      icon: <Cpu size={16} />,
      details: {
        title: 'Groq Chat Model (LLM)',
        type: 'Groq Model Node',
        model: 'llama3-70b-8192',
        configs: [
          { label: 'Temperature', value: '0.3' },
          { label: 'Max Tokens', value: '1024' }
        ]
      }
    },
    {
      id: 'chat-memory',
      type: 'sub-node',
      title: 'Window Buffer Memory',
      desc: 'Context session buffer',
      icon: <Database size={16} />,
      details: {
        title: 'Window Buffer Memory',
        type: 'Memory Node',
        configs: [
          { label: 'Session ID Key', value: '{{ $json.sessionId }}' },
          { label: 'Window Size (turns)', value: '10' }
        ]
      }
    },
    {
      id: 'chat-vector',
      type: 'tool',
      title: 'Qdrant Vector Store',
      desc: 'Retrieval tool agent',
      icon: <Database size={16} />,
      details: {
        title: 'Qdrant Vector Store (Retrieve Tool)',
        type: 'Vector Store Tool Node',
        collection: 'study_curriculum',
        configs: [
          { label: 'Search Type', value: 'Similarity / Embeddings' },
          { label: 'Top K', value: '3' }
        ]
      }
    },
    {
      id: 'chat-embeddings',
      type: 'sub-node',
      title: 'Embeddings Google Gemini',
      desc: 'embedding-001 model',
      icon: <Cpu size={16} />,
      details: {
        title: 'Google Gemini Embeddings',
        type: 'Embeddings Node',
        model: 'models/embedding-001',
        configs: [
          { label: 'Dimensions', value: '768' }
        ]
      }
    },
    {
      id: 'chat-quiz-tool',
      type: 'tool',
      title: 'generate_student_quiz',
      desc: 'Sub-workflow quiz tool',
      icon: <FileText size={16} />,
      details: {
        title: 'Quiz Generation Tool',
        type: 'Workflow Tool Node',
        subWorkflow: 'Generate Quiz Sub-playbook',
        configs: [
          { label: 'Output Schema', value: 'Markdown Quiz Blocks' }
        ]
      }
    },
    {
      id: 'chat-respond',
      type: 'action',
      title: 'Respond to Webhook',
      desc: 'Returns agent output',
      icon: <Webhook size={16} />,
      details: {
        title: 'Respond to Webhook Node',
        type: 'Response Node',
        responseBody: `{
  "reply": "{{ $json.output }}"
}`,
        configs: [
          { label: 'Status Code', value: '200' },
          { label: 'Content Type', value: 'application/json' }
        ]
      }
    }
  ];

  // ----------------------------------------------------
  // WORKFLOW 2: Drive Syllabus Indexer (Screenshot 1)
  // ----------------------------------------------------
  const indexerWorkflowNodes = [
    {
      id: 'idx-webhook',
      type: 'trigger',
      title: 'Webhook',
      desc: 'Instant trigger webhook',
      icon: <Webhook size={16} />
    },
    {
      id: 'idx-drive-search',
      type: 'action',
      title: 'Search Curriculum Files',
      desc: 'Google Drive file folder lookup',
      icon: <HardDrive size={16} />,
      details: {
        title: 'Google Drive: Search Files',
        type: 'Google Drive Node',
        configs: [
          { label: 'Search Query', value: "mimeType = 'application/pdf' or name contains 'curriculum'" },
          { label: 'Search Target', value: 'Syllabus folder' }
        ]
      }
    },
    {
      id: 'idx-filter',
      type: 'action',
      title: 'Keep Only Documents',
      desc: 'Document mime filter',
      icon: <FileText size={16} />,
      details: {
        title: 'Filter: Keep Only Documents',
        type: 'Filter Node',
        configs: [
          { label: 'Condition', value: 'Keep if file type matches doc/pdf/txt' }
        ]
      }
    },
    {
      id: 'idx-loop',
      type: 'action',
      title: 'Loop Over Files',
      desc: 'Iterates documents list',
      icon: <Repeat size={16} />,
      details: {
        title: 'n8n Loop Over Files',
        type: 'Loop Node',
        configs: [
          { label: 'Batch Size', value: '1' }
        ]
      }
    },
    {
      id: 'idx-download',
      type: 'action',
      title: 'Download File',
      desc: 'Downloads binary file contents',
      icon: <HardDrive size={16} />,
      details: {
        title: 'Google Drive: Download File',
        type: 'Google Drive Node',
        configs: [
          { label: 'File ID Source', value: '{{ $json.fileId }}' }
        ]
      }
    },
    {
      id: 'idx-qdrant',
      type: 'action',
      title: 'Qdrant Vector Store',
      desc: 'Embed syllabus chunks',
      icon: <Database size={16} />,
      details: {
        title: 'Qdrant Vector Store (Writer)',
        type: 'Qdrant Vector Node',
        collection: 'study_curriculum',
        configs: [
          { label: 'Operation', value: 'Insert Documents' }
        ]
      }
    },
    {
      id: 'idx-gemini-embed',
      type: 'sub-node',
      title: 'Embeddings Google Gemini',
      desc: 'model embedding-001',
      icon: <Cpu size={16} />
    },
    {
      id: 'idx-splitter',
      type: 'sub-node',
      title: 'Text Splitter',
      desc: 'Chunking rules node',
      icon: <Scissors size={16} />
    },
    {
      id: 'idx-loader',
      type: 'sub-node',
      title: 'Document Loader',
      desc: 'Binary to text extractor',
      icon: <FileText size={16} />
    }
  ];

  // ----------------------------------------------------
  // WORKFLOW 3: Document Uploader (Screenshot 3)
  // ----------------------------------------------------
  const uploaderWorkflowNodes = [
    {
      id: 'upl-trigger',
      type: 'trigger',
      title: 'Upload Curriculum Documents',
      desc: 'Manual form submit trigger',
      icon: <Webhook size={16} />,
      details: {
        title: 'Manual Upload Trigger',
        type: 'Manual Input / Webhook',
        configs: [
          { label: 'Form Type', value: 'File Drag-and-Drop' }
        ]
      }
    },
    {
      id: 'upl-qdrant',
      type: 'action',
      title: 'Qdrant Vector Store',
      desc: 'Write document embeddings',
      icon: <Database size={16} />,
      details: {
        title: 'Qdrant Vector Store (Manual Input)',
        type: 'Qdrant Node',
        collection: 'study_curriculum',
        configs: [
          { label: 'Host', value: 'http://qdrant.workspace.local:6333' }
        ]
      }
    },
    {
      id: 'upl-gemini',
      type: 'sub-node',
      title: 'Embeddings Google Gemini',
      desc: 'embedding-001 embeddings',
      icon: <Cpu size={16} />
    },
    {
      id: 'upl-loader',
      type: 'sub-node',
      title: 'Load Uploaded Files',
      desc: 'Buffer parsing node',
      icon: <FileText size={16} />
    },
    {
      id: 'upl-splitter',
      type: 'sub-node',
      title: 'Chunk Text',
      desc: 'Splitter (size 500, overlap 50)',
      icon: <Scissors size={16} />
    }
  ];

  // Get nodes based on active workflow tab selection
  const getWorkflowNodes = () => {
    switch (activeWorkflow) {
      case 'indexer': return indexerWorkflowNodes;
      case 'uploader': return uploaderWorkflowNodes;
      default: return chatWorkflowNodes;
    }
  };

  // Map the active simulation step number (1 to 11) to the actual active node ID
  const getStepActiveId = () => {
    if (activeStep === 0) return null;
    if (activeWorkflow !== 'chat') return null; // Only chat workflow simulates during chat
    
    // Mapping:
    // Step 1: Webhook received -> 'chat-webhook'
    // Step 2-7: Agent Processing -> 'chat-agent'
    // Step 3 (Gemini Embedding) -> 'chat-embeddings'
    // Step 4 (Qdrant Vector Search) -> 'chat-vector'
    // Step 6 (AI generation) -> 'chat-model'
    // Step 11: Respond -> 'chat-respond'
    
    if (activeStep === 1) return 'chat-webhook';
    if (activeStep === 3) return 'chat-embeddings';
    if (activeStep === 4) return 'chat-vector';
    if (activeStep === 6) return 'chat-model';
    if (activeStep === 11) return 'chat-respond';
    if (activeStep >= 2 && activeStep <= 10) return 'chat-agent';
    return null;
  };

  const activeNodeId = getStepActiveId();

  return (
    <div className="visualizer-container">
      {/* Canvas Area */}
      <div className="visualizer-canvas bg-grid">
        <div className="visualizer-header" style={{ marginBottom: '14px' }}>
          <h2 className="visualizer-title">AI Agent workflow</h2>
          <p className="visualizer-subtitle">Matching your active Qdrant & Gemini n8n flowcharts</p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
          <button 
            onClick={() => { setActiveWorkflow('chat'); setSelectedNode(null); }}
            className={`mode-toggle-btn ${activeWorkflow === 'chat' ? 'mode-toggle-mock' : ''}`}
            style={{ fontSize: '9px', padding: '6px 12px' }}
          >
            Chat Agent Flow
          </button>
          <button 
            onClick={() => { setActiveWorkflow('indexer'); setSelectedNode(null); }}
            className={`mode-toggle-btn ${activeWorkflow === 'indexer' ? 'mode-toggle-mock' : ''}`}
            style={{ fontSize: '9px', padding: '6px 12px' }}
          >
            Syllabus Indexer
          </button>
          <button 
            onClick={() => { setActiveWorkflow('uploader'); setSelectedNode(null); }}
            className={`mode-toggle-btn ${activeWorkflow === 'uploader' ? 'mode-toggle-mock' : ''}`}
            style={{ fontSize: '9px', padding: '6px 12px' }}
          >
            Manual Uploader
          </button>
        </div>

        {/* Grid Canvas representation of node configurations */}
        <div className="visualizer-flow" style={{ position: 'relative' }}>
          {/* Custom diagram layout matching the screenshots */}
          {activeWorkflow === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
              {/* Row 1: Webhook -> Agent -> Response */}
              <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <NodeButton step={chatWorkflowNodes[0]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
                <div style={{ width: '20px', height: '1px', borderTop: '1px dashed var(--border-color)' }}></div>
                <NodeButton step={chatWorkflowNodes[1]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
                <div style={{ width: '20px', height: '1px', borderTop: '1px dashed var(--border-color)' }}></div>
                <NodeButton step={chatWorkflowNodes[7]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
              </div>

              {/* Sub-connections for Agent (Screenshot 2: Model, Memory, Qdrant, Quiz) */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Model</span>
                  <NodeButton step={chatWorkflowNodes[2]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Memory</span>
                  <NodeButton step={chatWorkflowNodes[3]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Vector Store</span>
                  <NodeButton step={chatWorkflowNodes[4]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
                  <div style={{ height: '10px', width: '1px', borderLeft: '1px dashed var(--border-color)' }}></div>
                  <NodeButton step={chatWorkflowNodes[5]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Quiz Tool</span>
                  <NodeButton step={chatWorkflowNodes[6]} activeNodeId={activeNodeId} selectedNode={selectedNode} onClick={setSelectedNode} />
                </div>
              </div>
            </div>
          )}

          {activeWorkflow === 'indexer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
              {/* Screenshot 1 Row layout: Webhook -> Search -> Keep Only -> Loop Over -> Download */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <NodeButton step={indexerWorkflowNodes[0]} />
                <NodeButton step={indexerWorkflowNodes[1]} onClick={setSelectedNode} selectedNode={selectedNode} />
                <NodeButton step={indexerWorkflowNodes[2]} onClick={setSelectedNode} selectedNode={selectedNode} />
                <NodeButton step={indexerWorkflowNodes[3]} onClick={setSelectedNode} selectedNode={selectedNode} />
                <NodeButton step={indexerWorkflowNodes[4]} onClick={setSelectedNode} selectedNode={selectedNode} />
              </div>
              
              {/* Row 2: Gemini, Qdrant Vector, Splitter, Loader */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '20px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Embedding</span>
                  <NodeButton step={indexerWorkflowNodes[6]} />
                </div>
                
                <NodeButton step={indexerWorkflowNodes[5]} onClick={setSelectedNode} selectedNode={selectedNode} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <NodeButton step={indexerWorkflowNodes[8]} />
                  <NodeButton step={indexerWorkflowNodes[7]} />
                </div>
              </div>
            </div>
          )}

          {activeWorkflow === 'uploader' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', alignItems: 'center' }}>
              {/* Screenshot 3 Layout */}
              <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                <NodeButton step={uploaderWorkflowNodes[0]} onClick={setSelectedNode} selectedNode={selectedNode} />
                <NodeButton step={uploaderWorkflowNodes[1]} onClick={setSelectedNode} selectedNode={selectedNode} />
              </div>

              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Embedding Model</span>
                  <NodeButton step={uploaderWorkflowNodes[2]} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <NodeButton step={uploaderWorkflowNodes[3]} />
                  <NodeButton step={uploaderWorkflowNodes[4]} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail slide out panel */}
      {selectedNode && selectedNode.details && (
        <div className="visualizer-drawer animate-fade-in">
          <div className="drawer-header">
            <h3 className="drawer-title">{selectedNode.details.title}</h3>
            <button onClick={() => setSelectedNode(null)} className="drawer-close-btn">
              <X size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="drawer-section">
              <span className="drawer-section-label">Node Type</span>
              <div className="drawer-text-box" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                {selectedNode.details.type}
              </div>
            </div>

            {selectedNode.details.url && (
              <div className="drawer-section">
                <span className="drawer-section-label">Webhook URL</span>
                <div className="drawer-input-row">
                  <input type="text" readOnly value={selectedNode.details.url} className="drawer-input" />
                  <button onClick={() => handleCopy(selectedNode.details.url)} className="drawer-copy-btn">
                    {copiedText ? <Check size={11} style={{ color: 'var(--accent-emerald-light)' }} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            )}

            {selectedNode.details.prompt && (
              <div className="drawer-section">
                <span className="drawer-section-label">Node Prompts / Logic</span>
                <textarea readOnly value={selectedNode.details.prompt} rows={8} className="drawer-text-area" />
              </div>
            )}

            {selectedNode.details.responseBody && (
              <div className="drawer-section">
                <span className="drawer-section-label">Response JSON body</span>
                <pre className="drawer-code-box">{selectedNode.details.responseBody}</pre>
              </div>
            )}

            {selectedNode.details.configs && (
              <div className="drawer-section">
                <span className="drawer-section-label">Parameters</span>
                <div className="drawer-configs-table">
                  {selectedNode.details.configs.map((c, i) => (
                    <div key={i} className="drawer-config-row">
                      <span className="drawer-config-key">{c.label}</span>
                      <span className="drawer-config-val">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component wrapper for nodes in diagram
function NodeButton({ step, activeNodeId, selectedNode, onClick }) {
  if (!step) return null;
  const isExecuting = activeNodeId === step.id;
  const isSelected = selectedNode?.id === step.id;

  let activeClass = '';
  if (isExecuting) activeClass = 'node-executing active-pulse';
  if (isSelected) activeClass = 'node-selected';

  return (
    <button
      onClick={() => onClick && onClick(step)}
      className={`node-btn ${activeClass}`}
      style={{ width: '160px', padding: '10px', borderRadius: '12px', gap: '8px' }}
    >
      <div className="node-icon-box" style={{ height: '28px', width: '28px', borderRadius: '8px' }}>
        {step.icon}
      </div>
      <div className="node-info" style={{ textAlign: 'left' }}>
        <h4 className="node-title" style={{ fontSize: '10px', marginTop: 0 }}>{step.title}</h4>
        <p className="node-desc" style={{ fontSize: '8px' }}>{step.desc}</p>
      </div>
    </button>
  );
}
