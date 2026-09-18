import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Zap, BarChart2 } from 'lucide-react';

export default function LogsDashboard({ executions }) {
  const [selectedExec, setSelectedExec] = useState(null);
  const [subTab, setSubTab] = useState('logs'); // 'logs' | 'analytics'

  const totalRuns = executions.length;
  const successRate = totalRuns > 0 
    ? Math.round((executions.filter(e => e.status === 'success').length / totalRuns) * 100) 
    : 100;
  
  const avgTime = totalRuns > 0 
    ? Math.round(executions.reduce((acc, e) => acc + e.duration, 0) / totalRuns) 
    : 0;

  return (
    <div className="logs-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      {/* Tab Switcher Header */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginTop: '-4px' }}>
        <button
          onClick={() => setSubTab('logs')}
          className={`mode-toggle-btn ${subTab === 'logs' ? 'mode-toggle-mock' : ''}`}
          style={{ fontSize: '10px', padding: '8px 16px', borderRadius: '8px' }}
        >
          ⚙️ Run Executions Logs
        </button>
        <button
          onClick={() => setSubTab('analytics')}
          className={`mode-toggle-btn ${subTab === 'analytics' ? 'mode-toggle-mock' : ''}`}
          style={{ fontSize: '10px', padding: '8px 16px', borderRadius: '8px' }}
        >
          📊 Study Progress & Analytics
        </button>
      </div>

      {subTab === 'logs' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease' }}>
          {/* Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-panel">
              <div className="metric-icon-box metric-box-purple">
                <Zap size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Executions</span>
                <h4 className="metric-val">{totalRuns}</h4>
              </div>
            </div>

            <div className="metric-panel">
              <div className="metric-icon-box metric-box-emerald">
                <CheckCircle2 size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Success Rate</span>
                <h4 className="metric-val">{successRate}%</h4>
              </div>
            </div>

            <div className="metric-panel">
              <div className="metric-icon-box metric-box-blue">
                <Clock size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Avg Latency</span>
                <h4 className="metric-val">{avgTime} ms</h4>
              </div>
            </div>
          </div>

          <div className="logs-data-panel">
            {/* Table of Executions */}
            <div className="history-card">
              <div className="history-header">
                <h3 className="history-title">
                  <BarChart2 size={16} style={{ color: 'var(--accent-purple)' }} /> Execution History
                </h3>
              </div>

              <div className="history-table-wrapper">
                {totalRuns === 0 ? (
                  <div className="no-logs-box">
                    <p className="no-logs-title">No executions recorded yet.</p>
                    <p className="no-logs-sub">Send chat messages to execute the Relay.app playbook.</p>
                  </div>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Execution ID</th>
                        <th>Timestamp</th>
                        <th>Profile</th>
                        <th>Path</th>
                        <th style={{ textAlign: 'right' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.map((exec) => (
                        <tr 
                          key={exec.id}
                          onClick={() => setSelectedExec(exec)}
                          className={`history-row ${selectedExec?.id === exec.id ? 'history-row-selected' : ''}`}
                        >
                          <td>
                            {exec.status === 'success' ? (
                              <div className="status-badge status-badge-success">
                                <CheckCircle2 size={12} />
                                <span>Success</span>
                              </div>
                            ) : (
                              <div className="status-badge status-badge-failed">
                                <XCircle size={12} />
                                <span>Failed</span>
                              </div>
                            )}
                          </td>
                          <td className="log-hash">{exec.id.slice(0, 8)}...</td>
                          <td>{new Date(exec.timestamp).toLocaleTimeString()}</td>
                          <td style={{ color: 'var(--accent-purple-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>v_{exec.version}</td>
                          <td>
                            <span className={`path-badge ${exec.path === 'A' ? 'path-badge-a' : 'path-badge-b'}`}>
                              Path {exec.path} ({exec.path === 'A' ? 'Existing' : 'New'})
                            </span>
                          </td>
                          <td className="log-duration">{exec.duration} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Selected Log Side Panel */}
            {selectedExec && (
              <div className="log-details-drawer animate-fade-in">
                <div className="log-details-header">
                  <h4 className="log-details-title">Execution Parameters</h4>
                  <p className="log-details-hash">ID: {selectedExec.id}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="log-details-section">
                    <span className="log-details-label">User Query</span>
                    <div className="log-details-box">
                      {selectedExec.query}
                    </div>
                  </div>

                  <div className="log-details-section">
                    <span className="log-details-label">Assistant Response</span>
                    <div className="log-details-box">
                      {selectedExec.response}
                    </div>
                  </div>

                  <div className="log-details-meta">
                    <div className="log-meta-row">
                      <span className="log-meta-key">Execution Route</span>
                      <span className="log-meta-val">Path {selectedExec.path}</span>
                    </div>
                    <div className="log-meta-row">
                      <span className="log-meta-key">Grounding Matches</span>
                      <span className="log-meta-val" style={{ color: 'var(--accent-emerald-light)' }}>3 matches</span>
                    </div>
                    <div className="log-meta-row">
                      <span className="log-meta-key">Payload Size</span>
                      <span className="log-meta-val log-meta-val-mono">
                        {Math.round(JSON.stringify(selectedExec).length / 1024 * 100) / 100} KB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease' }}>
          {/* Analytics Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-panel">
              <div className="metric-icon-box metric-box-purple">
                <Clock size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Study Time</span>
                <h4 className="metric-val">24.5 Hrs</h4>
              </div>
            </div>

            <div className="metric-panel">
              <div className="metric-icon-box metric-box-emerald">
                <CheckCircle2 size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Quiz Accuracy</span>
                <h4 className="metric-val">88%</h4>
              </div>
            </div>

            <div className="metric-panel">
              <div className="metric-icon-box metric-box-blue">
                <BarChart2 size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Active Scopes</span>
                <h4 className="metric-val">3 Folders</h4>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Subject Mastery Radar Card */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '13px', margin: '0 0 16px 0', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📚 Subject Mastery Index
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { name: 'Computer Networks', progress: 92, color: 'var(--accent-purple)' },
                  { name: 'Database Systems', progress: 81, color: 'var(--accent-blue-light)' },
                  { name: 'Biology', progress: 78, color: 'var(--accent-emerald)' }
                ].map((subj, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                      <span style={{ color: '#e2e8f0' }}>{subj.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{subj.progress}% Mastery</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${subj.progress}%`, height: '100%', background: subj.color, borderRadius: '3px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goal Study Checklist Card */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '13px', margin: '0 0 16px 0', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Study Target Checklist
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { text: 'Analyze Unit I Database Syllabus', done: true },
                  { text: 'Achieve >80% on Protocols Quiz', done: true },
                  { text: 'Review Feynman critique comments', done: false },
                  { text: 'Mind-map transport layer nodes', done: false }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      defaultChecked={item.done} 
                      style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--accent-purple)' }} 
                    />
                    <span style={{ fontSize: '11px', color: item.done ? 'var(--text-muted)' : '#e2e8f0', textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
