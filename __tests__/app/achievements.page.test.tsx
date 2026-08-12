import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the auth module so we can control whether a session exists
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock the database queries for achievements
vi.mock('@/db/queries/achievements', () => ({
  getUserAchievements: vi.fn(),
  getActiveAchievementDefinitions: vi.fn(),
}));

// Mock next/navigation to intercept redirect calls
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...arguments_: unknown[]) => {
    mockRedirect(...arguments_);
    // Throw to halt execution, matching Next.js redirect behaviour
    throw new Error('NEXT_REDIRECT');
  },
}));

import { auth } from '@/auth';
import { getActiveAchievementDefinitions, getUserAchievements } from '@/db/queries/achievements';
import AchievementsPage from '@/app/dashboard/achievements/page';

const mockedAuth = vi.mocked(auth);
const mockedGetUserAchievements = vi.mocked(getUserAchievements);
const mockedGetActiveAchievementDefinitions = vi.mocked(getActiveAchievementDefinitions);

describe('AchievementsPage', () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedGetUserAchievements.mockReset();
    mockedGetActiveAchievementDefinitions.mockReset();
    mockRedirect.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the login page when there is no session', async () => {
    mockedAuth.mockResolvedValue(null);

    await expect(AchievementsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('displays the page heading and description', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '1' } } as any);
    mockedGetUserAchievements.mockResolvedValue([]);
    mockedGetActiveAchievementDefinitions.mockResolvedValue([]);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument();
    expect(
      screen.getByText('View the badges you have earned and discover new ones to unlock')
    ).toBeInTheDocument();
  });

  it('shows an empty state message when the user has no earned badges', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '1' } } as any);
    mockedGetUserAchievements.mockResolvedValue([]);
    mockedGetActiveAchievementDefinitions.mockResolvedValue([]);

    const page = await AchievementsPage();
    render(page);

    expect(
      screen.getByText(
        'You have not earned any badges yet. Keep working out to unlock achievements!'
      )
    ).toBeInTheDocument();
  });

  it('shows a congratulations message when the user has earned all available badges', async () => {
    const earnedBadge = {
      id: 1,
      code: 'first-workout',
      name: 'First Workout',
      description: 'Complete your first workout',
      image_url: '/badges/first-workout.svg',
      category: 'workout',
      active: true,
      earned_at: new Date('2026-01-15'),
      source_workout_id: 10,
    };

    mockedAuth.mockResolvedValue({ user: { id: '1' } } as any);
    mockedGetUserAchievements.mockResolvedValue([earnedBadge]);
    mockedGetActiveAchievementDefinitions.mockResolvedValue([
      {
        id: 1,
        code: 'first-workout',
        name: 'First Workout',
        description: 'Complete your first workout',
        image_url: '/badges/first-workout.svg',
        active: true,
        rules: [],
      },
    ]);

    const page = await AchievementsPage();
    render(page);

    expect(
      screen.getByText('Congratulations! You have earned every available badge.')
    ).toBeInTheDocument();
  });

  it('displays earned badges with their name and description', async () => {
    const earnedBadges = [
      {
        id: 1,
        code: 'first-workout',
        name: 'First Workout',
        description: 'Complete your first workout',
        image_url: '/badges/first-workout.svg',
        category: 'workout',
        active: true,
        earned_at: new Date('2026-01-15'),
        source_workout_id: 10,
      },
      {
        id: 2,
        code: 'five-workouts',
        name: 'Five Workouts',
        description: 'Complete five workouts',
        image_url: '/badges/five-workouts.svg',
        category: 'workout',
        active: true,
        earned_at: new Date('2026-02-10'),
        source_workout_id: 50,
      },
    ];

    mockedAuth.mockResolvedValue({ user: { id: '1' } } as any);
    mockedGetUserAchievements.mockResolvedValue(earnedBadges);
    mockedGetActiveAchievementDefinitions.mockResolvedValue([
      {
        id: 1,
        code: 'first-workout',
        name: 'First Workout',
        description: 'Complete your first workout',
        image_url: '/badges/first-workout.svg',
        active: true,
        rules: [],
      },
      {
        id: 2,
        code: 'five-workouts',
        name: 'Five Workouts',
        description: 'Complete five workouts',
        image_url: '/badges/five-workouts.svg',
        active: true,
        rules: [],
      },
    ]);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('First Workout')).toBeInTheDocument();
    expect(screen.getByText('Complete your first workout')).toBeInTheDocument();
    expect(screen.getByText('Five Workouts')).toBeInTheDocument();
    expect(screen.getByText('Complete five workouts')).toBeInTheDocument();
  });

  it('displays unearned badges with their name and description', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '1' } } as any);
    mockedGetUserAchievements.mockResolvedValue([]);
    mockedGetActiveAchievementDefinitions.mockResolvedValue([
      {
        id: 3,
        code: 'one-kilometre',
        name: 'One Kilometre',
        description: 'Run a total of one kilometre',
        image_url: '/badges/one-kilometre.svg',
        active: true,
        rules: [],
      },
      {
        id: 4,
        code: 'fifteen-minutes',
        name: 'Fifteen Minutes',
        description: 'Work out for fifteen minutes in a single session',
        image_url: '/badges/fifteen-minutes.svg',
        active: true,
        rules: [],
      },
    ]);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('One Kilometre')).toBeInTheDocument();
    expect(screen.getByText('Run a total of one kilometre')).toBeInTheDocument();
    expect(screen.getByText('Fifteen Minutes')).toBeInTheDocument();
    expect(
      screen.getByText('Work out for fifteen minutes in a single session')
    ).toBeInTheDocument();
  });

  it('separates earned and unearned badges correctly when the user has some of each', async () => {
    const earnedBadge = {
      id: 1,
      code: 'first-workout',
      name: 'First Workout',
      description: 'Complete your first workout',
      image_url: '/badges/first-workout.svg',
      category: 'workout',
      active: true,
      earned_at: new Date('2026-01-15'),
      source_workout_id: 10,
    };

    const allDefinitions = [
      {
        id: 1,
        code: 'first-workout',
        name: 'First Workout',
        description: 'Complete your first workout',
        image_url: '/badges/first-workout.svg',
        active: true,
        rules: [],
      },
      {
        id: 5,
        code: 'fifty-calories',
        name: 'Fifty Calories',
        description: 'Burn fifty calories in a single session',
        image_url: '/badges/fifty-calories.svg',
        active: true,
        rules: [],
      },
    ];

    mockedAuth.mockResolvedValue({ user: { id: '1' } } as any);
    mockedGetUserAchievements.mockResolvedValue([earnedBadge]);
    mockedGetActiveAchievementDefinitions.mockResolvedValue(allDefinitions);

    const page = await AchievementsPage();
    render(page);

    // The earned section should contain the earned badge
    expect(screen.getByText('First Workout')).toBeInTheDocument();

    // The unearned section should contain the badge not yet earned
    expect(screen.getByText('Fifty Calories')).toBeInTheDocument();
    expect(screen.getByText('Burn fifty calories in a single session')).toBeInTheDocument();

    // The congratulations message should NOT appear since there are unearned badges
    expect(
      screen.queryByText('Congratulations! You have earned every available badge.')
    ).not.toBeInTheDocument();
  });

  it('passes the correct user identifier to the achievements query', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '42' } } as any);
    mockedGetUserAchievements.mockResolvedValue([]);
    mockedGetActiveAchievementDefinitions.mockResolvedValue([]);

    const page = await AchievementsPage();
    render(page);

    expect(mockedGetUserAchievements).toHaveBeenCalledWith(42);
  });
});
