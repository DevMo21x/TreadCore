import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from '@/stores';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.getState().clear();
  });

  it('starts with an empty queue', () => {
    expect(useNotificationStore.getState().queue).toEqual([]);
  });

  it('pushes an xp notification with a generated id', () => {
    const id = useNotificationStore.getState().push({
      type: 'xp',
      message: 'Session complete. +120 XP',
    });

    expect(id).toEqual(expect.any(String));
    expect(useNotificationStore.getState().queue).toEqual([
      {
        id,
        type: 'xp',
        message: 'Session complete. +120 XP',
      },
    ]);
  });

  it('appends notifications in insertion order', () => {
    const xpId = useNotificationStore.getState().push({
      type: 'xp',
      message: 'Daily streak bonus. +20 XP',
    });
    const badgeId = useNotificationStore.getState().push({
      type: 'badge',
      name: 'First Mile',
      description: 'Completed your first mile.',
      imagePath: '/badges/first-mile.svg',
    });

    expect(useNotificationStore.getState().queue).toEqual([
      {
        id: xpId,
        type: 'xp',
        message: 'Daily streak bonus. +20 XP',
      },
      {
        id: badgeId,
        type: 'badge',
        name: 'First Mile',
        description: 'Completed your first mile.',
        imagePath: '/badges/first-mile.svg',
      },
    ]);
  });

  it('dismisses a notification by id without affecting the rest of the queue', () => {
    const xpId = useNotificationStore.getState().push({
      type: 'xp',
      message: 'Session complete. +120 XP',
    });
    const badgeId = useNotificationStore.getState().push({
      type: 'badge',
      name: 'First Mile',
      description: 'Completed your first mile.',
      imagePath: null,
    });

    useNotificationStore.getState().dismiss(xpId);

    expect(useNotificationStore.getState().queue).toEqual([
      {
        id: badgeId,
        type: 'badge',
        name: 'First Mile',
        description: 'Completed your first mile.',
        imagePath: null,
      },
    ]);
  });
});
