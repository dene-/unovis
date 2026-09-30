export interface Palette {
	name: string;
	paper: string;
	paper2: string;
	ink: string;
	red: string;
	accents: readonly string[];
}

export const PALETTES = {
	proun: {
		name: 'Proun',
		paper: '#e8e0c9',
		paper2: '#d9cfb3',
		ink: '#1c1b1e',
		red: '#c3262c',
		accents: ['#8b8c86', '#bdb59d']
	},
	wedge: {
		name: 'Red Wedge',
		paper: '#efe7d3',
		paper2: '#e1d7bd',
		ink: '#121113',
		red: '#d1232a',
		accents: ['#a59e8b']
	},
	verdigris: {
		name: 'Verdigris',
		paper: '#e1e2c7',
		paper2: '#d6ca90',
		ink: '#212026',
		red: '#b73e47',
		accents: ['#8d9b9a', '#8db4b9', '#d6ca90']
	},
	ochre: {
		name: 'Ochre',
		paper: '#ece1c5',
		paper2: '#e2d0a2',
		ink: '#1a1918',
		red: '#d6372b',
		accents: ['#e0a52e', '#6f6a60']
	},
	cobalt: {
		name: 'Cobalt',
		paper: '#e6dcc6',
		paper2: '#d5c8ad',
		ink: '#241f22',
		red: '#b8322c',
		accents: ['#2f5e8c', '#c99a3a', '#8e8a80']
	},
	steel: {
		name: 'Steel',
		paper: '#dcd6c4',
		paper2: '#c8c1ab',
		ink: '#151515',
		red: '#c8142f',
		accents: ['#6b7b84', '#a2a9a7']
	},
	suprematist: {
		name: 'Suprematist',
		paper: '#efebe1',
		paper2: '#e4dfd2',
		ink: '#141316',
		red: '#c1272d',
		accents: ['#23408e', '#e2b227', '#2e6a45', '#7c4f8f']
	},
	calico: {
		name: 'Calico',
		paper: '#ebe3d0',
		paper2: '#dccfb3',
		ink: '#1b1a1d',
		red: '#c9302c',
		accents: ['#3b5f93', '#8f8a7c']
	},
	cinema: {
		name: 'Cinema',
		paper: '#ebdfc8',
		paper2: '#dccdae',
		ink: '#151315',
		red: '#d4322a',
		accents: ['#e7892b', '#2d6c7a', '#e5c34b']
	}
} as const satisfies Record<string, Palette>;

export type PaletteId = keyof typeof PALETTES;

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];
