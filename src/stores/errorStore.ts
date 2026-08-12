import { createToastStore } from './createToastStore';

export type ErrorNotification = { id: string; title: string; message: string };

export const useErrorStore = createToastStore<ErrorNotification>();

export default useErrorStore;
