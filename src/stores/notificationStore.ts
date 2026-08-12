import { createToastStore } from './createToastStore';

/**
 * Ephemeral notification queue for dashboard overlays.
 *
 * Notifications live only in memory and are intended for short-lived UI toasts.
 */

export type Notification =
  | { id: string; type: 'xp'; message: string }
  | { id: string; type: 'badge'; name: string; description: string; imagePath: string | null };

// Distributive conditional type to correctly derive the discriminated input union
// without collapsing it. Plain Omit<Notification, 'id'> does not distribute over
// union members and loses the type discriminant.
type NotificationInput = Notification extends infer N
  ? N extends Notification
    ? Omit<N, 'id'>
    : never
  : never;

export const useNotificationStore = createToastStore<Notification, NotificationInput>();

export default useNotificationStore;
