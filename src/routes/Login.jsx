import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { findUserByEmail, saveUser, setSession, initializeStorage } from '../lib/storage';
import { createUser } from '../lib/models';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initializeStorage();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (!isLogin) {
      if (!formData.name) {
        setError('Name is required');
        return false;
      }
      if (formData.name.length < 2) {
        setError('Name must be at least 2 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 3) {
        setError('Password must be at least 3 characters');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login logic
        const user = findUserByEmail(formData.email);
        if (!user) {
          setError('No user found with this email');
          setLoading(false);
          return;
        }

        if (user.password !== formData.password) {
          setError('Invalid password');
          setLoading(false);
          return;
        }
        
        setSession(user.id);
        navigate('/contacts');
      } else {
        // Signup logic
        const existingUser = findUserByEmail(formData.email);
        if (existingUser) {
          setError('User with this email already exists');
          setLoading(false);
          return;
        }

        const newUser = createUser(formData.email, formData.name, formData.password);
        const result = saveUser(newUser);
        
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }

        setSession(newUser.id);
        navigate('/contacts');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (email) => {
    setFormData({
      ...formData,
      email: email,
      password: '123'
    });
  };

  return (
    <div className="container">
      <div className="card">
        <div className="text-center mb-2">
          <h1>🤖 Smart Chat</h1>
          <p className="text-muted">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-color)',
            color: 'white',
            padding: '0.75rem',
            borderRadius: 'var(--border-radius)',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="mb-1"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button" 
            className="secondary" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({
                email: '',
                name: '',
                password: '',
                confirmPassword: ''
              });
            }}
            disabled={loading}
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>
      </div>

      {isLogin && (
        <div className="card">
          <h4 className="text-center mb-1">Demo Accounts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="secondary"
              onClick={() => fillDemoCredentials('alice@example.com')}
              disabled={loading}
            >
              Login as Alice (alice@example.com)
            </button>
            <button 
              type="button" 
              className="secondary"
              onClick={() => fillDemoCredentials('bob@example.com')}
              disabled={loading}
            >
              Login as Bob (bob@example.com)
            </button>
            <button 
              type="button" 
              className="secondary"
              onClick={() => fillDemoCredentials('charlie@example.com')}
              disabled={loading}
            >
              Login as Charlie (charlie@example.com)
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-muted">
        <small>All data is stored locally in your browser</small>
      </div>
    </div>
  );
};

export default Login;