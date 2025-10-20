/**
 * Workflow Template Panel
 * UI for managing workflow templates
 * 
 * Task 6.2: AI Configuration Management - Subtask 2
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface WorkflowTemplatePanelProps {
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const WorkflowTemplatePanel: React.FC<WorkflowTemplatePanelProps> = ({ onNotification }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ai/config/workflow-templates');
      setTemplates(response.data.data || []);
    } catch (error) {
      onNotification('error', 'Failed to fetch workflow templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (selectedTemplate.id) {
        await axios.put(`/api/ai/config/workflow-templates/${selectedTemplate.id}`, selectedTemplate);
      } else {
        await axios.post('/api/ai/config/workflow-templates', selectedTemplate);
      }
      onNotification('success', 'Workflow template saved successfully');
      fetchTemplates();
      setIsEditing(false);
    } catch (error: any) {
      onNotification('error', error.response?.data?.error || 'Failed to save template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Workflow Templates</h3>
        <button
          onClick={() => {
            setSelectedTemplate({
              name: '',
              description: '',
              stages: [],
              qualityThresholds: { minimum: 0.7, autoApproval: 0.85, humanReview: 0.75 },
              timeout: 300000,
              maxRetries: 3,
              retryDelay: 1000,
              isDefault: false,
              isActive: true,
            });
            setIsEditing(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                    <span>{template.stages.length} stages</span>
                    <span>Timeout: {template.timeout / 1000}s</span>
                    <span className={template.isActive ? 'text-green-600' : 'text-gray-400'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal - Simplified for brevity */}
      {isEditing && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {selectedTemplate.id ? 'Edit' : 'Create'} Workflow Template
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={selectedTemplate.description}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Quality</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedTemplate.qualityThresholds.minimum}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        qualityThresholds: {
                          ...selectedTemplate.qualityThresholds,
                          minimum: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Auto Approval</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedTemplate.qualityThresholds.autoApproval}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        qualityThresholds: {
                          ...selectedTemplate.qualityThresholds,
                          autoApproval: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Human Review</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedTemplate.qualityThresholds.humanReview}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        qualityThresholds: {
                          ...selectedTemplate.qualityThresholds,
                          humanReview: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTemplate.isActive}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTemplatePanel;
