import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { IssueForm } from '../components/IssueForm';
import { issuesAPI, metadataAPI } from '../services/api';

export const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [severityLevels, setSeverityLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterCategory, filterSeverity, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query params
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;

      // Fetch all data in parallel
      const [issuesRes, categoriesRes, severityRes] = await Promise.all([
        issuesAPI.getAll(params),
        metadataAPI.getCategories(),
        metadataAPI.getSeverityLevels()
      ]);

      setIssues(issuesRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setSeverityLevels(severityRes.data.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;

    try {
      await issuesAPI.delete(id);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Failed to delete issue. Please try again.');
    }
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingIssue(null);
    fetchData();
  };

  const filteredIssues = issues.filter(issue =>
    issue.dataset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (level) => {
    if (!level) return 'gray';
    if (level >= 5) return 'red';
    if (level >= 4) return 'orange';
    if (level >= 3) return 'yellow';
    if (level >= 2) return 'lime';
    return 'green';
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'red',
      'in_progress': 'yellow',
      'resolved': 'green',
      'closed': 'gray'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Quality Issues</h1>
          <p className="text-gray-600 mt-1">
            Manage and track data quality across your datasets
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Issue
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by dataset, description, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {(filterCategory || filterSeverity || filterStatus) && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                {severityLevels.map(sev => (
                  <option key={sev.id} value={sev.id}>{sev.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">
            {searchTerm || filterCategory || filterSeverity || filterStatus
              ? 'No issues match your filters. Try adjusting them.'
              : 'No issues found. Create your first one!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dataset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scores
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {issue.dataset_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={issue.description}>
                      {issue.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.category?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {issue.severity ? (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full bg-${getSeverityColor(issue.severity.level)}-100 text-${getSeverityColor(issue.severity.level)}-800`}
                        >
                          {issue.severity.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full capitalize bg-${getStatusColor(issue.status)}-100 text-${getStatusColor(issue.status)}-800`}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-1 text-xs">
                        <span title="Accuracy" className="font-medium">A: {issue.accuracy_score || '-'}</span>
                        <span>/</span>
                        <span title="Completeness" className="font-medium">C: {issue.completeness_score || '-'}</span>
                        <span>/</span>
                        <span title="Timeliness" className="font-medium">T: {issue.timeliness_score || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(issue)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          title="Edit Issue"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(issue.id)}
                          className="text-red-600 hover:text-red-900 transition"
                          title="Delete Issue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Form Modal */}
      {showForm && (
        <IssueForm
          issue={editingIssue}
          categories={categories}
          severityLevels={severityLevels}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};