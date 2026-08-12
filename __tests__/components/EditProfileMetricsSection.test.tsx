import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditProfileMetricsSection } from '@/components/profile/EditProfileMetricsSection';
import { updateCurrentProfileMetricsFormAction } from '@/lib/actions/user';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/actions/user', () => ({
  updateCurrentProfileMetricsFormAction: vi.fn(),
}));

const refresh = vi.fn();
const back = vi.fn();
const forward = vi.fn();
const prefetch = vi.fn();
const push = vi.fn();
const replace = vi.fn();
const mockedUseRouter = vi.mocked(useRouter);
const mockedUpdateCurrentProfileMetricsFormAction = vi.mocked(
  updateCurrentProfileMetricsFormAction
);

const mockRouter: AppRouterInstance = {
  back,
  forward,
  refresh,
  push,
  replace,
  prefetch,
};

function enterWithNumberPad(user: ReturnType<typeof userEvent.setup>, value: string) {
  return value.split('').reduce(async (previousPromise, character) => {
    await previousPromise;
    await user.click(screen.getByRole('button', { name: character }));
  }, Promise.resolve());
}

describe('EditProfileMetricsSection', () => {
  beforeEach(() => {
    back.mockReset();
    forward.mockReset();
    prefetch.mockReset();
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue(mockRouter);
    mockedUpdateCurrentProfileMetricsFormAction.mockReset();
    mockedUpdateCurrentProfileMetricsFormAction.mockImplementation(
      async (_previousState, formData) => {
        if (formData.get('weightKg') === '25') {
          return {
            status: 'error',
            message: 'Invalid profile metrics input',
          };
        }

        return {
          status: 'success',
          message: 'Profile metrics updated successfully.',
          updatedWeightKg:
            String(formData.get('weightKg')).trim().length > 0
              ? Number(formData.get('weightKg'))
              : null,
          updatedAgeYears:
            String(formData.get('ageYears')).trim().length > 0
              ? Number(formData.get('ageYears'))
              : null,
        };
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reveals and hides the edit form', async () => {
    const user = userEvent.setup();

    render(<EditProfileMetricsSection weightKg={null} ageYears={null} />);

    await user.click(screen.getByRole('button', { name: 'Edit Metrics' }));

    expect(screen.getByLabelText('Weight (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Age (years)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '.' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Weight (kg)')).not.toBeInTheDocument();
  });

  it('renders an inline error when the metrics action fails', async () => {
    const user = userEvent.setup();

    render(<EditProfileMetricsSection weightKg={null} ageYears={null} />);

    await user.click(screen.getByRole('button', { name: 'Edit Metrics' }));
    await enterWithNumberPad(user, '25');
    await user.click(screen.getByRole('button', { name: 'Enter' }));
    await enterWithNumberPad(user, '30');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid profile metrics input')).toBeInTheDocument();
    });

    expect(refresh).not.toHaveBeenCalled();
  });

  it('updates the visible metrics and refreshes the page after success', async () => {
    const user = userEvent.setup();

    render(<EditProfileMetricsSection weightKg={null} ageYears={null} />);

    await user.click(screen.getByRole('button', { name: 'Edit Metrics' }));
    await enterWithNumberPad(user, '72.5');
    await user.click(screen.getByRole('button', { name: 'Enter' }));
    await enterWithNumberPad(user, '34');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Profile metrics updated successfully.')).toBeInTheDocument();
      expect(screen.getByText('72.5 kg')).toBeInTheDocument();
      expect(screen.getByText('34 years')).toBeInTheDocument();
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});
