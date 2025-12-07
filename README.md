# decrunch

A colorful terminal loading animation using random tiles and 256-color support.

## Installation

```bash
npm install decrunch
```

## Usage

### Promise Wrapper

Wrap any async task with the loading animation:

```typescript
import { whileDecrunching } from './animation.js';

// Wrap any promise
const result = await whileDecrunching(
  fetch('https://api.example.com/data'), {
		// default options
		border: 0,
		fps: 25
	}
);
```

### Manual Control

Start and stop the animation manually:

```typescript
import { startDecrunching } from './animation.js';

const stopDecrunching = startDecrunching({
	// default options
	border: 0
	fps: 30,
});

// Do your work...
await someTask();

stopDecrunching();
```

## API

### `whileDecrunching<T>(task: Promise<T>, options?: AnimationOptions): Promise<T>`

Runs a loading animation while waiting for a promise to resolve.

- `task`: The promise to await
- `options`: Optional configuration object
  - `fps`: Frames per second (default: 25)
  - `border`: Number of characters to leave empty on all sides (default: 0)
- Returns: The result of the promise

### `startDecrunching(options?: AnimationOptions): () => void`

Starts the animation and returns a function to stop it.

- `options`: Optional configuration object
  - `fps`: Frames per second (default: 25)
  - `border`: Number of characters to leave empty on all sides (default: 0)
- Returns: A function to stop the animation and clear the screen

### Options

#### `option.border``

Type: `number`  
Default: 25  

Border with on all sides.

#### `option.fps``

Type: `number`  
Default: 25  

Frames per second.

## License ©️

This work is licensed under [The MIT License](LICENSE).
