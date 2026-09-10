import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  const testCredentials = [
    { role: 'Admin', email: 'admin@erp.com', password: 'Admin@123', color: '#6366f1' },
    { role: 'Sales', email: 'sales@erp.com', password: 'Sales@123', color: '#10b981' },
    { role: 'Warehouse', email: 'warehouse@erp.com', password: 'Ware@123', color: '#f59e0b' },
    { role: 'Accounts', email: 'accounts@erp.com', password: 'Acct@123', color: '#3b82f6' },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <Zap size={28} color="white" />
          </div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to your ERP+CRM Portal</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span style={{ fontSize: '1rem' }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email address
            </label>
            <div className="relative">
              <Mail
                size={16}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-text-dim)',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="login-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-text-dim)',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '36px', paddingRight: '42px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)',
                  padding: 0, display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
            style={{ marginTop: 'var(--space-2)' }}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Quick fill test credentials */}
        <div style={{ marginTop: 'var(--space-8)' }}>
          <div className="divider" style={{ margin: '0 0 var(--space-5)' }} />
          <p className="text-xs text-dim" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            Quick fill — Test Credentials
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {testCredentials.map((cred) => (
              <button
                key={cred.role}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                  setError('');
                }}
                style={{ justifyContent: 'flex-start', gap: 'var(--space-2)' }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: cred.color, flexShrink: 0,
                  }}
                />
                {cred.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
