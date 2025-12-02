const { rows, columns } = process.stdout;

if (!rows || !columns) {
	throw new Error('Unable to determine terminal size');
}

const tiles = ['▁', '▂', '▃', '▄', '▅', '▆'];

export interface AnimationOptions {
	fps?: number;
	border?: number;
}

interface BorderConfig {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

// Check if terminal supports 256 colors
function supports256Colors(): boolean {
	const term = process.env.TERM || '';
	const colorterm = process.env.COLORTERM || '';

	// Check COLORTERM first (most reliable)
	if (colorterm === 'truecolor' || colorterm === '24bit') {
		return true;
	}

	// Check TERM environment variable
	if (term.includes('256') || term.includes('256color')) {
		return true;
	}

	// Common terminals that support 256 colors
	const supports256 = ['xterm-256color', 'screen-256color', 'tmux-256color', 'rxvt-unicode-256color'];
	if (supports256.includes(term)) {
		return true;
	}

	return false;
}

const has256ColorSupport = supports256Colors();

if (!has256ColorSupport) {
	console.error('Warning: Your terminal may not support 256 colors. Set TERM=xterm-256color for best results.');
	console.error(`Current TERM: ${process.env.TERM}`);
}

// Pre-compute frequently used values
const tilesLength = tiles.length;

// Cache for performance
class AnimationRenderer {
	private readonly borderConfig: BorderConfig;
	private readonly drawableRows: number;
	private readonly drawableColumns: number;
	private readonly startRow: number;
	private readonly startCol: number;

	constructor(border: number) {
		this.borderConfig = {
			top: border,
			bottom: border,
			left: border,
			right: border,
		};
		this.drawableRows = rows - this.borderConfig.top - this.borderConfig.bottom;
		this.drawableColumns = columns - this.borderConfig.left - this.borderConfig.right;
		this.startRow = this.borderConfig.top + 1; // 1-indexed
		this.startCol = this.borderConfig.left + 1; // 1-indexed
	}

	renderFrame(): void {
		// Build entire frame in a single string buffer for one write operation
		const buffer: string[] = [];

		for (let row = 0; row < this.drawableRows; row++) {
			// Fast random tile selection using bitwise OR for floor operation
			const tileIndex = (Math.random() * tilesLength) | 0;
			const randomTile = tiles[tileIndex] ?? '▄'; // Fallback to default tile

			// Random foreground and background colors
			const fgColor = (Math.random() * 256) | 0;
			const bgColor = (Math.random() * 256) | 0;

			// Create line with repeated tile
			const line = randomTile.repeat(this.drawableColumns);

			// Apply both foreground and background color, then reset both
			// \x1b[39m resets foreground, \x1b[49m resets background
			// Using both explicit resets plus \x1b[0m for full reset
			const colored = `\x1b[38;5;${fgColor}m\x1b[48;5;${bgColor}m${line}\x1b[39m\x1b[49m`;

			// Position cursor and write line
			buffer.push(`\x1b[${this.startRow + row};${this.startCol}H${colored}`);
		}

		// Single write operation for entire frame
		process.stdout.write(buffer.join(''));
	}
}

function clearScreen(): void {
	process.stdout.write('\x1b[2J\x1b[H');
}

function initializeScreen(_border: number): void {
	// Clear the entire screen first
	clearScreen();

	// If there's a border, we could optionally render it here
	// For now, clearing is enough as the border will remain untouched
	// and the drawable area will be filled with content

	// Hide cursor for cleaner animation
	process.stdout.write('\x1b[?25l');
}

function restoreScreen(): void {
	clearScreen();
	// Show cursor again
	process.stdout.write('\x1b[?25h');
}

export async function withLoadingAnimation<T>(task: Promise<T>, options: AnimationOptions = {}): Promise<T> {
	const { fps = 30, border = 0 } = options;

	// Initialize screen before starting animation
	initializeScreen(border);

	// Create renderer instance (caches calculations)
	const renderer = new AnimationRenderer(border);

	const interval = setInterval(() => {
		renderer.renderFrame();
	}, 1000 / fps);

	try {
		const result = await task;
		clearInterval(interval);
		restoreScreen();
		return result;
	} catch (error) {
		clearInterval(interval);
		restoreScreen();
		throw error;
	}
}

export function startAnimation(options: AnimationOptions = {}): () => void {
	const { fps = 30, border = 0 } = options;

	// Initialize screen before starting animation
	initializeScreen(border);

	// Create renderer instance (caches calculations)
	const renderer = new AnimationRenderer(border);

	const interval = setInterval(() => {
		renderer.renderFrame();
	}, 1000 / fps);

	return () => {
		clearInterval(interval);
		restoreScreen();
	};
}
