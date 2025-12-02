# Decrunch

A colorful terminal loading animation using random tiles and 256-color support.

## Features

- 256-color terminal support with automatic detection
- Configurable FPS for animation speed
- Clean API for wrapping async tasks
- Full-screen animated tiles with random colors
- High-performance rendering with optimized write operations
- Configurable border spacing

## Installation

```bash
npm install
```

## Usage

### As a Promise Wrapper

Wrap any async task with the loading animation:

```typescript
import { withLoadingAnimation } from './animation.js';

// Wrap any promise (with default 1-character border)
const result = await withLoadingAnimation(
  fetch('https://api.example.com/data')
);

// With custom options
const result = await withLoadingAnimation(
  someAsyncTask(),
  { fps: 60, border: 2 } // 60 FPS with 2-character border
);
```

### Manual Control

Start and stop the animation manually:

```typescript
import { startAnimation } from './animation.js';

const stopAnimation = startAnimation({ fps: 30, border: 1 });

// Do your work...
await someTask();

stopAnimation(); // Clean up and clear screen
```

## API

### `withLoadingAnimation<T>(task: Promise<T>, options?: AnimationOptions): Promise<T>`

Runs a loading animation while waiting for a promise to resolve.

- `task`: The promise to await
- `options`: Optional configuration object
  - `fps`: Frames per second (default: 30)
  - `border`: Number of characters to leave empty on all sides (default: 1)
- Returns: The result of the promise

### `startAnimation(options?: AnimationOptions): () => void`

Starts the animation and returns a function to stop it.

- `options`: Optional configuration object
  - `fps`: Frames per second (default: 30)
  - `border`: Number of characters to leave empty on all sides (default: 1)
- Returns: A function to stop the animation and clear the screen

### `AnimationOptions`

```typescript
interface AnimationOptions {
  fps?: number;    // Frames per second (default: 30)
  border?: number; // Border width in characters (default: 1)
}
```

## Terminal Support

The animation automatically detects 256-color support by checking:
- `COLORTERM` environment variable
- `TERM` environment variable

If your terminal doesn't support 256 colors, set:
```bash
export TERM=xterm-256color
```

## Examples

See [src/index.ts](src/index.ts) for a complete example.

## Performance

The animation is highly optimized for performance:

- **Single write per frame**: All rows are batched into a single `write()` call instead of multiple writes
- **Cached calculations**: Border and drawable area dimensions are computed once and reused
- **Bitwise operations**: Uses `| 0` instead of `Math.floor()` for faster integer conversion
- **Inline ANSI codes**: Avoids function call overhead by inlining escape sequences
- **Minimal allocations**: Reuses the same renderer instance across all frames

These optimizations allow smooth animations even at high FPS (60+) on large terminals.

## License ©️

This work is licensed under [The MIT License](LICENSE).
