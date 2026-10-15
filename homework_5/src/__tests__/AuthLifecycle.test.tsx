import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/supabase/useAuth';
const mocks = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({ getSupabaseClient: mocks.getClient }));
function Status() {
  const { isLoading, userId, error } = useAuth();
  return <p>{isLoading ? 'loading' : `${userId ?? 'anonymous'} ${error}`}</p>;
}
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('Auth lifecycle regressions', () => {
  it('shows missing configuration instead of crashing the application', async () => {
    mocks.getClient.mockImplementation(() => { throw new Error('Missing project configuration'); });
    await act(async () => { render(<AuthProvider><Status /></AuthProvider>); });
    expect(screen.getByText(/Missing project configuration/)).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });
  it('unsubscribes and ignores a late initial session after a sign-out event', async () => {
    let resolve!: (value: unknown) => void;
    let onChange!: (event: string, session: null) => void;
    const unsubscribe = vi.fn();
    mocks.getClient.mockReturnValue({ auth: {
      onAuthStateChange: vi.fn((cb) => { onChange = cb; return { data: { subscription: { unsubscribe } } }; }),
      getSession: vi.fn(() => new Promise((r) => { resolve = r; })),
    } });
    const view = render(<AuthProvider><Status /></AuthProvider>);
    await act(async () => {
      onChange('SIGNED_OUT', null);
      resolve({ data: { session: { user: { id: 'old-user' } } }, error: null });
    });
    expect(screen.getByText(/anonymous/)).toBeInTheDocument();
    expect(screen.queryByText(/old-user/)).not.toBeInTheDocument();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
  it('ends loading and displays an initial session failure', async () => {
    mocks.getClient.mockReturnValue({ auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockRejectedValue(new Error('Session network failure')),
    } });
    await act(async () => { render(<AuthProvider><Status /></AuthProvider>); });
    expect(screen.getByText(/Session network failure/)).toBeInTheDocument();
  });
});
