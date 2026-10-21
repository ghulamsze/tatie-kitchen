import React, { useState, useEffect } from 'react';
import { Dialog, InputField, Button } from '../../design/components/index.ts';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client.ts';

export interface DeviceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSetupModal: React.FC<DeviceSetupModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured()) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email);
      }
    });
  }, [isOpen]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (!isSupabaseConfigured()) {
      setIsError(true);
      setStatusMessage('Kunci Supabase belum disetel di .env.');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsError(false);
      setStatusMessage('');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsError(true);
        setStatusMessage(error.message);
        return;
      }

      if (data.user?.email) {
        setUserEmail(data.user.email);
        setStatusMessage('Perangkat berhasil dipasangkan ke akun toko!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      setIsError(true);
      setStatusMessage(err instanceof Error ? err.message : 'Gagal masuk akun perangkat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setStatusMessage('Sesi perangkat telah keluar.');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Setup Akun Perangkat Kasir"
      description="Masuk satu kali dengan akun Supabase ber-role 'device'. Pergantian kasir harian tidak memerlukan kata sandi."
    >
      {userEmail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--ctl)',
              border: '1px solid var(--ctl-line)',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
            }}
          >
            <div><b>Status:</b> Terpasang dan aktif</div>
            <div><b>Akun:</b> {userEmail}</div>
            <div><b>Toko:</b> Tati’e Kitchen</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="danger" size="md" onClick={handleSignOut} style={{ flex: 1 }}>
              Keluar Akun
            </Button>
            <Button variant="lime" size="md" onClick={onClose} style={{ flex: 1 }}>
              Selesai
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InputField
            type="email"
            placeholder="Email perangkat (contoh: tablet@tatie.id)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <InputField
            type="password"
            placeholder="Kata sandi akun perangkat"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />

          {statusMessage && (
            <div
              style={{
                fontSize: 'var(--t-xs)',
                lineHeight: 'var(--l-xs)',
                color: isError ? 'var(--danger)' : 'var(--accent)',
              }}
            >
              {statusMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button variant="flat" size="md" onClick={onClose} disabled={isSubmitting} style={{ flex: 1 }}>
              Batal
            </Button>
            <Button variant="lime" size="md" type="submit" disabled={isSubmitting} style={{ flex: 1 }}>
              {isSubmitting ? 'Memproses...' : 'Pasangkan Perangkat'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};
