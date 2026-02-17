import React, { useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const profileSchema = yup.object({
  name: yup.string().min(2).max(50).required('Name is required'),
  bio: yup.string().max(200, 'Max 200 characters').optional(),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'At least 6 characters')
    .matches(/\d/, 'Must contain a number')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm'),
});

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: { name: user?.name || '', bio: user?.bio || '' },
  });

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: pwErrors },
  } = useForm({ resolver: yupResolver(passwordSchema) });

  const onSaveProfile = async (data) => {
    setIsUpdating(true);
    try {
      const { data: res } = await api.put('/users/profile', data);
      updateUser(res.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onChangePassword = async (data) => {
    setIsChangingPw(true);
    try {
      await api.put('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed!');
      resetPassword();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <div className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="page-title">Profile Settings</h1>
              <p className="page-subtitle">Manage your account details</p>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          {/* Left: Avatar Card */}
          <div className="card profile-avatar-section">
            <div className="user-avatar" style={{ width: '80px', height: '80px', fontSize: '28px', margin: '0 auto 16px' }}>
              {getInitials(user?.name)}
            </div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-email">{user?.email}</div>
            {user?.bio && <div className="profile-bio">{user.bio}</div>}
            <div className="profile-meta">
              <div className="profile-meta-item">
                <span>👤</span>
                <span>{user?.role}</span>
              </div>
              {user?.createdAt && (
                <div className="profile-meta-item">
                  <span>📅</span>
                  <span>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Settings */}
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px' }}>
              {['profile', 'security'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                    background: activeTab === tab ? 'var(--accent-dim)' : 'transparent',
                    color: activeTab === tab ? 'var(--accent-light)' : 'var(--text-secondary)',
                    borderColor: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600,
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'profile' ? '👤 Profile Info' : '🔒 Security'}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <h3 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
                  Edit Profile
                </h3>
                <form onSubmit={handleProfile(onSaveProfile)}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      {...regProfile('name')}
                      className={`form-input ${profileErrors.name ? 'error' : ''}`}
                      placeholder="Your full name"
                    />
                    {profileErrors.name && <span className="form-error">⚠ {profileErrors.name.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    />
                    <span className="form-error" style={{ color: 'var(--text-muted)' }}>
                      Email cannot be changed
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea
                      {...regProfile('bio')}
                      className="form-input"
                      placeholder="Tell us something about yourself..."
                      rows={3}
                    />
                    {profileErrors.bio && <span className="form-error">⚠ {profileErrors.bio.message}</span>}
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={isUpdating}>
                    {isUpdating ? (
                      <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Saving...</>
                    ) : '✓ Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="card">
                <h3 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                  Change Password
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Use a strong password with at least 6 characters and one number.
                </p>
                <form onSubmit={handlePassword(onChangePassword)}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      {...regPassword('currentPassword')}
                      type="password"
                      className={`form-input ${pwErrors.currentPassword ? 'error' : ''}`}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                    {pwErrors.currentPassword && <span className="form-error">⚠ {pwErrors.currentPassword.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      {...regPassword('newPassword')}
                      type="password"
                      className={`form-input ${pwErrors.newPassword ? 'error' : ''}`}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    {pwErrors.newPassword && <span className="form-error">⚠ {pwErrors.newPassword.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      {...regPassword('confirmPassword')}
                      type="password"
                      className={`form-input ${pwErrors.confirmPassword ? 'error' : ''}`}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                    {pwErrors.confirmPassword && <span className="form-error">⚠ {pwErrors.confirmPassword.message}</span>}
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={isChangingPw}>
                    {isChangingPw ? (
                      <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Updating...</>
                    ) : '🔒 Change Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
