import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Zap, BarChart2 } from 'lucide-react';

export default function LogsDashboard({ executions }) {
  const [selectedExec, setSelectedExec] = useState(null);

  const totalRuns = executions.length;
  const successRate = totalRuns > 0 
    ? Math.round((executions.filter(e => e.status === 'success').length / totalRuns) * 100) 
    : 100;
  
  const avgTime = totalRuns > 0 
    ? Math.round(executions.reduce((acc, e) => acc + e.duration, 0) / totalRuns) 
    : 0;

  return (
    <div className="logs-container">
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
  );
}
