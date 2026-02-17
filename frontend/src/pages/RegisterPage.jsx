import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';

const schema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long')
    .required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/\d/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({ resolver: yupResolver(schema) });

  const password = watch('password', '');
  const passwordStrength = !password ? 0 :
    [password.length >= 6, /\d/.test(password), /[A-Z]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#6366f1', '#22d3a0'];

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password });
      navigate('/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        setServerError(errData.errors.map((e) => e.message).join(', '));
      } else {
        setServerError(errData?.error || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow top-left" />
      <div className="auth-glow bottom-right" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <span className="auth-logo-text">PrimeTrade</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start managing your tasks today</p>

        {serverError && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#ef4444',
          }}>
            ⚠️ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              {...register('name')}
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="John Doe"
              autoComplete="name"
            />
            {errors.name && <span className="form-error">⚠ {errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="form-error">⚠ {errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min. 6 characters, include a number"
                autoComplete="new-password"
                style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', padding: '4px' }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <span className="form-error">⚠ {errors.password.message}</span>}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '3px', borderRadius: '2px',
                      background: i <= passwordStrength ? strengthColors[passwordStrength] : 'var(--border)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: strengthColors[passwordStrength] }}>
                  {strengthLabel[passwordStrength]} password
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="form-error">⚠ {errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Creating account...</>
            ) : (
              'Create Account →'
            )}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
