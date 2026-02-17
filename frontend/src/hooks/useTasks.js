import { useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [stats, setStats] = useState(null);

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks/stats/summary');
      setStats(data);
    } catch {}
  }, []);

  const createTask = useCallback(async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    toast.success('Task created!');
    return data.task;
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    const { data } = await api.put(`/tasks/${id}`, taskData);
    toast.success('Task updated!');
    return data.task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.delete(`/tasks/${id}`);
    toast.success('Task deleted.');
  }, []);

  return { tasks, loading, pagination, stats, fetchTasks, fetchStats, createTask, updateTask, deleteTask, setTasks };
};
