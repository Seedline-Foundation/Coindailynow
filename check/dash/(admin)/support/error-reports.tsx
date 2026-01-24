// Admin UI to view and update user error reports
'use client';
import React, { useEffect, useState } from 'react';

interface ErrorReport {
  id: string;
  email: string;
  description: string;
  screenshot: string | null;
  createdAt: string;
  status: string;
  updates: { message: string; date: string }[];
}

export default function AdminErrorReportsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetch('/api/support/list-reports')
      .then(res => res.json())
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateReport = async () => {
    if (!selectedReport) return;
    await fetch('/api/support/update-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedReport.id,
        status: newStatus || undefined,
        comment: newComment || undefined,
      }),
    });
    setNewStatus('');
    setNewComment('');
    setSelectedReport(null);
    // Refresh reports
    fetch('/api/support/list-reports')
      .then(res => res.json())
      .then(setReports);
  };

  return (
    <main>
      <h1>User Error Reports</h1>
      {loading ? <p>Loading...</p> : (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Description</th>
                <th>Screenshot</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.email}</td>
                  <td>{r.description}</td>
                  <td>{r.screenshot ? <a href={`/error-reports/${r.screenshot}`} target="_blank" rel="noopener noreferrer">View</a> : 'None'}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => setSelectedReport(r)}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedReport && (
            <div className="update-form" style={{ marginTop: 20, padding: 20, border: '1px solid #ccc' }}>
              <h3>Update Report #{selectedReport.id}</h3>
              <label>
                Status:
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Keep current ({selectedReport.status})</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label>
                Add Comment:
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Optional update for user..." />
              </label>
              <button onClick={handleUpdateReport}>Save Changes</button>
              <button onClick={() => setSelectedReport(null)}>Cancel</button>
              
              {selectedReport.updates && selectedReport.updates.length > 0 && (
                <div>
                  <h4>Previous Updates:</h4>
                  {selectedReport.updates.map((update, i) => (
                    <div key={i} style={{ padding: 5, background: '#f5f5f5', margin: '5px 0' }}>
                      <strong>{new Date(update.date).toLocaleString()}:</strong> {update.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
