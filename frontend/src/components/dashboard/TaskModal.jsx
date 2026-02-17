import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';

const schema = yup.object({
  title: yup.string().min(1).max(100, 'Max 100 characters').required('Title is required'),
  description: yup.string().max(500, 'Max 500 characters').optional(),
  status: yup.string().oneOf(['todo', 'in-progress', 'done']).required(),
  priority: yup.string().oneOf(['low', 'medium', 'high']).required(),
  dueDate: yup.string().optional(),
});

const TaskModal = ({ task, onClose, onSave, isLoading }) => {
  const isEdit = !!task?._id;
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(task?.tags || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    },
  });

  useEffect(() => {
    reset({
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    });
    setTags(task?.tags || []);
  }, [task, reset]);

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tags.includes(val) && tags.length < 5) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  const onSubmit = (data) => {
    const payload = { ...data, tags };
    if (!payload.dueDate) delete payload.dueDate;
    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-icon" onClick={onClose} title="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              {...register('title')}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="What needs to be done?"
              autoFocus
            />
            {errors.title && <span className="form-error">⚠ {errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              className="form-input"
              placeholder="Add more details..."
              rows={3}
            />
            {errors.description && <span className="form-error">⚠ {errors.description.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-input filter-select">
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select {...register('priority')} className="form-input filter-select">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              {...register('dueDate')}
              type="date"
              className="form-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (press Enter or comma)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Add tags..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
            {tags.length > 0 && (
              <div className="tags-container">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                    <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}
              style={{ width: 'auto', paddingLeft: '24px', paddingRight: '24px' }}>
              {isLoading
                ? <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Saving...</>
                : isEdit ? '✓ Update Task' : '+ Create Task'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
