import React, { useState } from 'react';
import { useLaptopAuthStore } from './laptopAuthStore.ts';
import { Button } from '../../design/components/Button.tsx';

export const LaptopLoginScreen: React.FC = () => {
  const [email, setEmail] = useState('example@gmail.com');
  const [password, setPassword] = useState('');
  const [isGoogleDialogOpen, setIsGoogleDialogOpen] = useState(false);

  const { login, loginWithGoogle, isLoginLoading, loginError } = useLaptopAuthStore();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      useLaptopAuthStore.setState({ loginError: 'Kata sandi tidak boleh kosong.' });
      return;
    }
    await login(email, password);
  };

  const handleGoogleSelect = async () => {
    setIsGoogleDialogOpen(false);
    await loginWithGoogle();
  };

  return (
    <div className="tk-laptop-login-screen">
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <b className="tk-laptop-login-brand">Tati’e Kitchen</b>

        <div className="tk-laptop-login-card g-acrylic">
          <b className="tk-laptop-login-title">Masuk</b>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div>
              <input
                type="email"
                className="tk-laptop-field"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
              />
            </div>

            <div>
              <input
                type="password"
                className={`tk-laptop-field ${loginError ? 'error' : ''}`}
                placeholder="Kata sandi"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (loginError) useLaptopAuthStore.setState({ loginError: null });
                }}
                aria-label="Kata sandi"
              />
            </div>

            {loginError && <span className="tk-laptop-error-msg em">{loginError}</span>}

            <Button
              type="submit"
              variant="lime"
              size="lg"
              disabled={isLoginLoading}
              style={{ width: '100%', height: '48px', borderRadius: 'var(--r-md)', marginTop: '4px' }}
            >
              {isLoginLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <i className="tk-laptop-spinner spn" />
                  Memeriksa akun
                </span>
              ) : (
                'Masuk'
              )}
            </Button>

            <button
              type="button"
              className="tk-laptop-google-btn"
              onClick={() => setIsGoogleDialogOpen(true)}
              style={{ marginTop: '4px' }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </div>

      {/* Dialog 10a: Pilihan Akun Google */}
      {isGoogleDialogOpen && (
        <div className="tk-laptop-overlay" onClick={() => setIsGoogleDialogOpen(false)}>
          <div
            className="tk-laptop-dialog g-liquid"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-dialog-title"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              <b className="dt" id="google-dialog-title">
                Masuk dengan Google
              </b>
            </div>

            <span style={{ fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', color: 'var(--ink-2)' }}>
              Pilih akun untuk melanjutkan ke Tati’e Kitchen.
            </span>

            <div
              className="tk-laptop-account-option"
              onClick={handleGoogleSelect}
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              role="button"
              aria-label="Pilih akun Pemilik example@gmail.com"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="tk-laptop-avatar" style={{ width: '36px', height: '36px' }}>
                  P
                </i>
                <span>
                  <b style={{ display: 'block', fontSize: 'var(--t-sm)' }}>Pemilik</b>
                  <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>example@gmail.com</span>
                </span>
              </span>
              <span style={{ fontSize: 'var(--t-md)', color: 'var(--ink-3)' }}>›</span>
            </div>

            <div
              className="tk-laptop-account-option"
              style={{ opacity: 0.65, cursor: 'not-allowed' }}
              aria-disabled="true"
            >
              <span style={{ fontSize: 'var(--t-sm)', fontWeight: 600 }}>Gunakan akun lain</span>
              <span style={{ fontSize: 'var(--t-md)', color: 'var(--ink-3)' }}>›</span>
            </div>

            <Button
              variant="flat"
              size="md"
              onClick={() => setIsGoogleDialogOpen(false)}
              style={{ width: '100%', marginTop: '4px' }}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
