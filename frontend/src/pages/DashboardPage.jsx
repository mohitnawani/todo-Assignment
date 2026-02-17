import React, { useEffect, useState, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import Sidebar from '../components/dashboard/Sidebar';
import TaskModal from '../components/dashboard/TaskModal';

const StatusBadge = ({ status }) => {
  const map = { todo: 'badge badge-todo', 'in-progress': 'badge badge-in-progress', done: 'badge badge-done' };
  const label = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
  return <span className={map[status]}>{label[status]}</span>;
};

const PriorityBadge = ({ priority }) => {
  const map = { low: 'badge badge-low', medium: 'badge badge-medium', high: 'badge badge-high' };
  return <span className={map[priority]}>{priority}</span>;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, loading, pagination, stats, fetchTasks, fetchStats, createTask, updateTask, deleteTask } = useTasks();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' });
  const searchTimeout = useRef(null);

  const loadTasks = useCallback(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    params.page = filters.page;
    params.limit = filters.limit;
    params.sortBy = filters.sortBy;
    params.order = filters.order;
    fetchTasks(params);
  }, [filters, fetchTasks]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: val, page: 1 }));
    }, 400);
  };

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const handleOpenCreate = () => { setEditingTask(null); setModalOpen(true); };
  const handleOpenEdit = (task) => { setEditingTask(task); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSaveTask = async (data) => {
    setIsSaving(true);
    try {
      if (editingTask?._id) {
        await updateTask(editingTask._id, data);
      } else {
        await createTask(data);
      }
      handleCloseModal();
      loadTasks();
      fetchStats();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setDeleteConfirm(null);
    loadTasks();
    fetchStats();
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
              <p className="page-subtitle">Here's what's on your plate today</p>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            + New Task
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card total">
            <span className="stat-icon">⚡</span>
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{stats?.summary?.total ?? '—'}</span>
          </div>
          <div className="stat-card todo">
            <span className="stat-icon">○</span>
            <span className="stat-label">To Do</span>
            <span className="stat-value">{stats?.summary?.todo ?? '—'}</span>
          </div>
          <div className="stat-card in-progress">
            <span className="stat-icon">◑</span>
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats?.summary?.['in-progress'] ?? '—'}</span>
          </div>
          <div className="stat-card done">
            <span className="stat-icon">✓</span>
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats?.summary?.done ?? '—'}</span>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="card">
          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrapper">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks..."
                onChange={handleSearchChange}
                defaultValue={filters.search}
              />
            </div>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              className="filter-select"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              className="filter-select"
              value={`${filters.sortBy}:${filters.order}`}
              onChange={(e) => {
                const [sortBy, order] = e.target.value.split(':');
                setFilters((f) => ({ ...f, sortBy, order, page: 1 }));
              }}
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="dueDate:asc">Due Date</option>
              <option value="priority:desc">Priority</option>
              <option value="title:asc">Title A–Z</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No tasks found</div>
              <div className="empty-state-desc">
                {filters.search || filters.status || filters.priority
                  ? 'Try adjusting your filters'
                  : 'Create your first task to get started'}
              </div>
              {!filters.search && !filters.status && !filters.priority && (
                <button className="btn btn-primary" style={{ width: 'auto', marginTop: '16px' }} onClick={handleOpenCreate}>
                  + Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="tasks-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Tags</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <div className="task-title">{task.title}</div>
                        {task.description && (
                          <div className="task-description">
                            {task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td><StatusBadge status={task.status} /></td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td>
                        {task.dueDate ? (
                          <span style={{ fontFamily: 'Space Mono', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {task.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="tag" style={{ fontSize: '10px', padding: '2px 6px' }}>#{tag}</span>
                          ))}
                          {task.tags?.length > 2 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{task.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="task-actions">
                          <button className="btn-icon" onClick={() => handleOpenEdit(task)} title="Edit">✏</button>
                          <button
                            className="btn-icon"
                            onClick={() => setDeleteConfirm(task._id)}
                            title="Delete"
                            style={{ borderColor: 'rgba(239,68,68,0.2)', color: 'var(--danger)' }}
                          >✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="pagination-buttons">
                <button
                  className="page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >←</button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                  return (
                    <button
                      key={p}
                      className={`page-btn ${p === pagination.page ? 'active' : ''}`}
                      onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    >{p}</button>
                  );
                })}
                <button
                  className="page-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >→</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          isLoading={isSaving}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Task?</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              This action cannot be undone. The task will be permanently deleted.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
