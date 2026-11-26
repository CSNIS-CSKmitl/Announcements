import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
	id: string;
	kind: ToastKind;
	message: string;
	duration: number;
}

const DEFAULT_DURATION = 3200;

function createToastStore() {
	const { subscribe, update } = writable<ToastItem[]>([]);
	const timers = new Map<string, ReturnType<typeof setTimeout>>();

	function dismiss(id: string) {
		const timer = timers.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.delete(id);
		}
		update((items) => items.filter((item) => item.id !== id));
	}

	function show(kind: ToastKind, message: string, duration = DEFAULT_DURATION) {
		const text = message.trim();
		if (!text) return '';
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		update((items) => [...items.slice(-2), { id, kind, message: text, duration }]);
		if (duration > 0) {
			const timer = setTimeout(() => dismiss(id), duration);
			timers.set(id, timer);
		}
		return id;
	}

	return {
		subscribe,
		show,
		dismiss,
		success: (message: string, duration = DEFAULT_DURATION) => show('success', message, duration),
		error: (message: string, duration = DEFAULT_DURATION) => show('error', message, duration),
		info: (message: string, duration = DEFAULT_DURATION) => show('info', message, duration)
	};
}

export const toast = createToastStore();
