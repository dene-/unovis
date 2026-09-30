declare global {
	namespace App {}

	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent;
	}

	interface Navigator {
		/** Safari's flag for a page launched from the home screen. */
		standalone?: boolean;
	}
}

export {};
