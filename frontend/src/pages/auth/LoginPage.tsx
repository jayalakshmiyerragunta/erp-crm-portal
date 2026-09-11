import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, Eye, EyeOff, Mail, Lock, Users, Package, FileText, ShieldCheck } from 'lucide-react';

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
    { role: 'Admin', email: 'admin@erp.com', password: 'Admin@123', color: '#4f46e5' },
    { role: 'Sales', email: 'sales@erp.com', password: 'Sales@123', color: '#059669' },
    { role: 'Warehouse', email: 'warehouse@erp.com', password: 'Ware@123', color: '#d97706' },
    { role: 'Accounts', email: 'accounts@erp.com', password: 'Acct@123', color: '#2563eb' },
  ];

  return (
    <div className="login-page">
      {/* Brand panel */}
      <div className="login-panel">
        <div className="login-panel-inner">
          <div className="login-brand">
            <div className="login-logo">
              <Zap size={22} />
            </div>
            <div className="login-brand-name">ERP+CRM</div>
          </div>

          <h2 className="login-panel-title">
            Operations Portal for your business
          </h2>
          <p className="login-panel-text">
            Manage customers, product inventory and sales challans from one
            focused workspace.
          </p>

          <ul className="login-panel-features">
            <li><Users size={16} /> Customer management with CRM follow-ups</li>
            <li><Package size={16} /> Real-time inventory &amp; low-stock alerts</li>
            <li><FileText size={16} /> Sales challans with PDF export</li>
            <li><ShieldCheck size={16} /> Role-based access for your team</li>
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-card-brand">
            <div className="login-card-logo">
              <Zap size={20} />
            </div>
            <div>
              <div className="login-title">Welcome back</div>
              <div className="text-xs text-dim">Sign in to the Operations Portal</div>
            </div>
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          <div className="login-quickfill">
            <p className="text-xs text-dim" style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: 'var(--space-1)' }}>
              Quick fill — test credentials
            </p>
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