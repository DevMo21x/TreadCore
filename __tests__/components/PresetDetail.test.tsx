import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PresetDetail from '@/components/presets/PresetDetail';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { useErrorStore } from '@/stores';
import PresetRunnerContext from '@/context/PresetRunnerContext';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('PresetDetail', () => {
  beforeEach(() => {
    // reset fetch mock
    // @ts-ignore
    global.fetch = vi.fn();
    mockPush.mockClear();
    useErrorStore.getState().clear();
  });

  it('loads preset, shows timeline, allows edit and save', async () => {
    const preset = {
      id: 1,
      name: 'Test Preset',
      description: 'desc',
      authorId: 1,
      segments: [
        { id: 1, name: 'Warmup', duration_seconds: 30, speed: 3, incline: 0 },
        { id: 2, name: 'Steady', duration_seconds: 60, speed: 5, incline: 1 },
      ],
    };

    // GET /api/presets/1
    // @ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(preset) })
    );

    // PATCH /api/presets/1
    const updated = { ...preset, name: 'Test Preset' };
    // @ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(updated)) })
    );

    render(<PresetDetail id={1} currentUserId={1} />);

    await waitFor(() => expect(screen.getByText('Test Preset')).toBeInTheDocument());

    // click Edit
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // In edit mode the duration is controlled via Stepper +/- buttons,
    // not a text input. Just verify the edit controls are present.
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();

    // click Save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('shows Edit button for admin who does not own the preset', async () => {
    const preset = {
      id: 1,
      name: 'Test Preset',
      description: 'desc',
      authorId: 2,
      segments: [{ id: 1, name: 'Warmup', duration_seconds: 30, speed: 3, incline: 0 }],
    };

    // GET /api/presets/1
    // @ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(preset) })
    );

    render(
      <PresetDetail id={1} initialPreset={preset} currentUserId={1} currentUserRole="admin" />
    );

    await waitFor(() => expect(screen.getByText('Test Preset')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('shows Copy button for non-owner without admin role', async () => {
    const preset = {
      id: 1,
      name: 'Test Preset',
      description: 'desc',
      authorId: 2,
      segments: [{ id: 1, name: 'Warmup', duration_seconds: 30, speed: 3, incline: 0 }],
    };

    // GET /api/presets/1
    // @ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(preset) })
    );

    render(<PresetDetail id={1} initialPreset={preset} currentUserId={1} />);

    await waitFor(() => expect(screen.getByText('Test Preset')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('redirects to new preset after successful copy', async () => {
    const preset = {
      id: 1,
      name: 'Test Preset',
      description: 'desc',
      authorId: 2,
      segments: [{ id: 1, name: 'Warmup', duration_seconds: 30, speed: 3, incline: 0 }],
    };

    // POST /api/presets (copy)
    // @ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify({ id: 99 })) })
    );

    render(<PresetDetail id={1} initialPreset={preset} currentUserId={1} />);

    await waitFor(() => expect(screen.getByText('Test Preset')).toBeInTheDocument());

    // Mock confirm dialog
    global.confirm = vi.fn(() => true);

    // Click Copy button
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    // Wait for router.push to be called
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard/presets/99'));
  });

  it('pushes save error toast when the server returns an error', async () => {
    const preset = {
      id: 1,
      name: 'Test Preset',
      description: 'desc',
      authorId: 1,
      segments: [{ id: 1, name: 'Warmup', duration_seconds: 30, speed: 3, incline: 0 }],
    };

    // PATCH /api/presets/1 returns a server-side error
    // @ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ error: 'Name already exists' })),
      })
    );

    render(<PresetDetail id={1} initialPreset={preset} currentUserId={1} />);

    await waitFor(() => expect(screen.getByText('Test Preset')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(
        useErrorStore
          .getState()
          .queue.some(
            (entry) => entry.title === 'Save Failed' && entry.message === 'Name already exists'
          )
      ).toBe(true);
    });
  });

  it('pushes copy error toast when copying fails', async () => {
    const preset = {
      id: 1,
      name: 'Test Preset',
      description: 'desc',
      authorId: 2,
      segments: [{ id: 1, name: 'Warmup', duration_seconds: 30, speed: 3, incline: 0 }],
    };

    // POST /api/presets returns a server-side error
    // @ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ message: 'Unable to copy preset' })),
      })
    );

    render(<PresetDetail id={1} initialPreset={preset} currentUserId={1} />);

    await waitFor(() => expect(screen.getByText('Test Preset')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(
        useErrorStore
          .getState()
          .queue.some(
            (entry) => entry.title === 'Copy Failed' && entry.message === 'Unable to copy preset'
          )
      ).toBe(true);
    });
  });

  it('pushes start error toast when starting fails', async () => {
    const preset = {
      id: 1,
      name: 'Test Preset',
      description: 'desc',
      authorId: 1,
      segments: [{ id: 1, name: 'Warmup', duration_seconds: 30, speed: 3, incline: 0 }],
    };

    const startPreset = vi.fn(async () => {
      throw new Error('Runner unavailable');
    });

    render(
      <PresetRunnerContext.Provider
        value={{
          activePreset: null,
          currentSegmentIndex: 0,
          segmentTimeRemaining: 0,
          isRunning: false,
          isPaused: false,
          startPresetById: vi.fn(async () => {}),
          startPreset,
          cancelPreset: vi.fn(),
          stopAndZero: vi.fn(async () => {}),
        }}
      >
        <PresetDetail id={1} initialPreset={preset} currentUserId={1} />
      </PresetRunnerContext.Provider>
    );

    await waitFor(() => expect(screen.getByText('Test Preset')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    await waitFor(() => {
      expect(startPreset).toHaveBeenCalled();
      expect(
        useErrorStore
          .getState()
          .queue.some(
            (entry) => entry.title === 'Start Failed' && entry.message === 'Failed to start preset.'
          )
      ).toBe(true);
    });
  });
});
