import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Role is never sent from frontend
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">BookNest</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        {error && <div className="alert alert-error" id="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          <div className="form-group">
            <label htmlFor="register-name">Name</label>
            <input
              type="text"
              id="register-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              type="email"
              id="register-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              type="password"
              id="register-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting} id="register-submit">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
