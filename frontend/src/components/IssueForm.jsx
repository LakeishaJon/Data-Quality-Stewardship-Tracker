import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiUrl } from '../config/api'; 

export const IssueForm = ({ issue, categories, severityLevels, onClose }) => {
  const [formData, setFormData] = useState({
    dataset_name: '',
    description: '',
    owner: '',
    issue_type: '',
    category_id: '',
    severity_id: '',
    accuracy_score: '',
    completeness_score: '',
    timeliness_score: '',
    status: 'open'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (issue) {
      setFormData({
        dataset_name: issue.dataset_name || '',
        description: issue.description || '',
        owner: issue.owner || '',
        issue_type: issue.issue_type || '',
        category_id: issue.category_id || '',
        severity_id: issue.severity_id || '',
        accuracy_score: issue.accuracy_score || '',
        completeness_score: issue.completeness_score || '',
        timeliness_score: issue.timeliness_score || '',
        status: issue.status || 'open'
      });
    }
  }, [issue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
        
      const url = issue 
        ? apiUrl(`/issues/${issue.id}`)
        : apiUrl('/issues');
      
      const method = issue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          accuracy_score: formData.accuracy_score ? parseInt(formData.accuracy_score) : null,
          completeness_score: formData.completeness_score ? parseInt(formData.completeness_score) : null,
          timeliness_score: formData.timeliness_score ? parseInt(formData.timeliness_score) : null,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save issue');
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {issue ? 'Edit Issue' : 'Create New Issue'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Dataset Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="dataset_name"
              value={formData.dataset_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="e.g., Customer Database"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Describe the data quality issue..."
            />
          </div>

          {/* Owner and Issue Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="issue_type"
                value={formData.issue_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="e.g., Missing Values"
              />
            </div>
          </div>

          {/* Category and Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                name="severity_id"
                value={formData.severity_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Severity</option>
                {severityLevels.map(sev => (
                  <option key={sev.id} value={sev.id}>{sev.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quality Scores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quality Scores (1-5)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Accuracy</label>
                <input
                  type="number"
                  name="accuracy_score"
                  value={formData.accuracy_score}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1-5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Completeness</label>
                <input
                  type="number"
                  name="completeness_score"
                  value={formData.completeness_score}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1-5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Timeliness</label>
                <input
                  type="number"
                  name="timeliness_score"
                  value={formData.timeliness_score}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1-5"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Saving...' : (issue ? 'Update Issue' : 'Create Issue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};