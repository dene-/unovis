type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
	const value = parseInt(hex.slice(1), 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function blend(from: string, to: string, amount: number): Rgb {
	const a = parseHex(from);
	const b = parseHex(to);
	return a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount)) as Rgb;
}

export function mix(from: string, to: string, amount: number): string {
	return `rgb(${blend(from, to, amount).join(',')})`;
}

export function mixHex(from: string, to: string, amount: number): string {
	return '#' + blend(from, to, amount).map((channel) => channel.toString(16).padStart(2, '0')).join('');
}

export const shade = (color: string, amount: number) => mix(color, '#000000', amount);
export const tint = (color: string, amount: number) => mix(color, '#ffffff', amount);
