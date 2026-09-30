export type Point = readonly [number, number];

export const TAU = Math.PI * 2;
export const QUARTER_TURN = Math.PI / 2;
const COS_30 = Math.cos(Math.PI / 6);

export function tracePolygon(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
	ctx.beginPath();
	ctx.moveTo(points[0][0], points[0][1]);
	for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
	ctx.closePath();
}

export interface BoxFaces {
	base: Point[];
	left: Point[];
	right: Point[];
	top: Point[];
}

export interface BoxColors {
	left: string;
	right: string;
	top: string;
}

/** Axonometric box whose back-bottom corner sits at the origin; `a` and `b` are the plan sides. */
export function isoBoxFaces(originX: number, originY: number, a: number, b: number, height: number): BoxFaces {
	const u: Point = [COS_30 * a, 0.5 * a];
	const v: Point = [-COS_30 * b, 0.5 * b];
	const up: Point = [0, -height];
	const at = (...steps: Point[]): Point =>
		steps.reduce<Point>((sum, step) => [sum[0] + step[0], sum[1] + step[1]], [originX, originY]);
	return {
		base: [at(), at(u), at(u, v), at(v)],
		left: [at(v), at(u, v), at(u, v, up), at(v, up)],
		right: [at(u), at(u, v), at(u, v, up), at(u, up)],
		top: [at(up), at(u, up), at(u, v, up), at(v, up)]
	};
}

/** The same box, positioned so its visual centre sits at the origin. */
export function centredIsoBoxFaces(a: number, b: number, height: number): BoxFaces {
	const spanX = COS_30 * a - COS_30 * b;
	const spanY = 0.5 * a + 0.5 * b;
	return isoBoxFaces(-spanX / 2, -spanY / 2 + height / 2, a, b, height);
}

export function fillBox(ctx: CanvasRenderingContext2D, faces: BoxFaces, colors: BoxColors): void {
	for (const side of ['left', 'right', 'top'] as const) {
		ctx.fillStyle = colors[side];
		tracePolygon(ctx, faces[side]);
		ctx.fill();
	}
}
