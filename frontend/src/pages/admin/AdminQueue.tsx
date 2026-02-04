/**
 * Admin Queue Dashboard - React Component
 * View and manage AI-generated articles pending approval
 */

import React, { useState, useEffect } from 'react';
import './AdminQueue.css';

interface QueueItem {
  id: string;
  article_id: string;
  title: string;
  topic: string;
  status: 'pending_approval' | 'approved' | 'edit_requested' | 'published';
  submitted_at: string;
  word_count: number;
  languages: string[];
  seo_score: number;
  image_url: string;
}

interface QueueStats {
  pending_approval: number;
  edit_requested: number;
  approved_today: number;
  total_pending: number;
}

export function AdminQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'content' | 'image' | 'translation' | 'research'>('content');
  const [editInstructions, setEditInstructions] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');

  useEffect(() => {
    fetchQueue();
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueue();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/admin/queue');
      const data = await response.json();
      if (data.success) {
        setQueue(data.queue);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleApprove = async (itemId: string) => {
    if (!confirm('Approve this article for publication?')) return;

    try {
      const response = await fetch(`/api/admin/queue/${itemId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: 'admin_' + Date.now(), // TODO: Get from auth context
          admin_notes: 'Approved from dashboard'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Article approved!');
        fetchQueue();
        fetchStats();
      } else {
        alert('Failed to approve: ' + data.error);
      }
    } catch (error) {
      alert('Error approving article: ' + error.message);
    }
  };

  const handleRequestEdit = async () => {
    if (!selectedItem) return;
    if (!editInstructions.trim()) {
      alert('Please provide edit instructions');
      return;
    }

    try {
      const response = await fetch(`/api/admin/queue/${selectedItem}/request-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edit_type: editType,
          instructions: editInstructions,
          target_language: editType === 'translation' ? targetLanguage : undefined,
          admin_id: 'admin_' + Date.now()
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Edit request sent to ${data.routing.agent}`);
        setEditModalOpen(false);
        setEditInstructions('');
        setTargetLanguage('');
        fetchQueue();
      } else {
        alert('Failed to request edit: ' + data.error);
      }
    } catch (error) {
      alert('Error requesting edit: ' + error.message);
    }
  };

  const handlePublish = async (itemId: string) => {
    if (!confirm('Publish this article? It will go live immediately.')) return;

    try {
      const response = await fetch(`/api/admin/queue/${itemId}/publish`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        alert('Article published successfully!');
        fetchQueue();
        fetchStats();
      } else {
        alert('Failed to publish: ' + data.error);
      }
    } catch (error) {
      alert('Error publishing article: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'pending_approval': { text: 'Pending Review', color: 'yellow' },
      'approved': { text: 'Approved', color: 'green' },
      'edit_requested': { text: 'Edit Requested', color: 'orange' },
      'published': { text: 'Published', color: 'blue' }
    };
    const badge = badges[status] || { text: status, color: 'gray' };
    return (
      <span className={`badge badge-${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-queue-container">
        <div className="loading">Loading queue...</div>
      </div>
    );
  }

  return (
    <div className="admin-queue-container">
      {/* Header */}
      <div className="queue-header">
        <h1>AI Content Review Queue</h1>
        <button onClick={fetchQueue} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.pending_approval}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.edit_requested}</div>
            <div className="stat-label">Edit Requested</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.approved_today}</div>
            <div className="stat-label">Approved Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_pending}</div>
            <div className="stat-label">Total Pending</div>
          </div>
        </div>
      )}

      {/* Queue Items */}
      <div className="queue-list">
        {queue.length === 0 ? (
          <div className="empty-state">
            <p>No articles in queue</p>
          </div>
        ) : (
          queue.map(item => (
            <div key={item.id} className="queue-item">
              <div className="item-image">
                <img src={item.image_url} alt={item.title} />
              </div>

              <div className="item-content">
                <div className="item-header">
                  <h3>{item.title}</h3>
                  {getStatusBadge(item.status)}
                </div>

                <p className="item-topic">{item.topic}</p>

                <div className="item-meta">
                  <span>📝 {item.word_count} words</span>
                  <span>🔍 SEO: {item.seo_score}/100</span>
                  <span>🌍 {item.languages.length} languages</span>
                  <span>🕒 {new Date(item.submitted_at).toLocaleString()}</span>
                </div>

                <div className="item-languages">
                  {item.languages.slice(0, 5).map(lang => (
                    <span key={lang} className="language-tag">{lang}</span>
                  ))}
                  {item.languages.length > 5 && (
                    <span className="language-tag">+{item.languages.length - 5} more</span>
                  )}
                </div>
              </div>

              <div className="item-actions">
                {item.status === 'pending_approval' && (
                  <>
                    <button 
                      onClick={() => handleApprove(item.id)}
                      className="btn btn-approve"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedItem(item.id);
                        setEditModalOpen(true);
                      }}
                      className="btn btn-edit"
                    >
                      ✏️ Request Edit
                    </button>
                  </>
                )}

                {item.status === 'approved' && (
                  <button 
                    onClick={() => handlePublish(item.id)}
                    className="btn btn-publish"
                  >
                    🚀 Publish
                  </button>
                )}

                <button 
                  onClick={() => window.open(`/api/admin/queue/${item.id}`, '_blank')}
                  className="btn btn-view"
                >
                  👁️ View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Request Modal */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Request Edit</h2>

            <div className="form-group">
              <label>Edit Type</label>
              <select 
                value={editType} 
                onChange={e => setEditType(e.target.value as any)}
                className="form-select"
              >
                <option value="content">Content (article text)</option>
                <option value="image">Image (regenerate)</option>
                <option value="translation">Translation (specific language)</option>
                <option value="research">Research (re-research topic)</option>
              </select>
            </div>

            {editType === 'translation' && (
              <div className="form-group">
                <label>Target Language</label>
                <select 
                  value={targetLanguage}
                  onChange={e => setTargetLanguage(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select Language --</option>
                  <option value="Hausa">Hausa</option>
                  <option value="Yoruba">Yoruba</option>
                  <option value="Igbo">Igbo</option>
                  <option value="Swahili">Swahili</option>
                  <option value="Amharic">Amharic</option>
                  <option value="Zulu">Zulu</option>
                  <option value="Shona">Shona</option>
                  <option value="Afrikaans">Afrikaans</option>
                  <option value="Somali">Somali</option>
                  <option value="Oromo">Oromo</option>
                  <option value="Arabic">Arabic</option>
                  <option value="French">French</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Wolof">Wolof</option>
                  <option value="Kinyarwanda">Kinyarwanda</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Edit Instructions</label>
              <textarea
                value={editInstructions}
                onChange={e => setEditInstructions(e.target.value)}
                placeholder="Describe what needs to be changed..."
                className="form-textarea"
                rows={5}
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleRequestEdit} className="btn btn-primary">
                Send Edit Request
              </button>
              <button onClick={() => setEditModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQueue;
