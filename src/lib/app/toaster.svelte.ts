const VISIBLE_FOR = 2200;

export class Toaster {
	message = $state('');
	visible = $state(false);
	#timer: ReturnType<typeof setTimeout> | undefined;

	show(message: string): void {
		this.message = message;
		this.visible = true;
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => (this.visible = false), VISIBLE_FOR);
	}
}
