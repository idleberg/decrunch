# decrunch

> An OBSTRUSIVE loading indicator for the terminal, reminiscent of Commodore
> 64's
> ["decrunching"](https://www.behance.net/gallery/116103231/LOADING-C64-Pixel-Art).

[![License](https://img.shields.io/github/license/idleberg/decrunch?color=blue&style=for-the-badge)](https://github.com/idleberg/decrunch/blob/main/LICENSE)
[![Version: npm](https://img.shields.io/npm/v/decrunch?style=for-the-badge)](https://www.npmjs.org/package/decrunch)
![GitHub branch check runs](https://img.shields.io/github/check-runs/idleberg/decrunch/main?style=for-the-badge)

## Installation

```bash
npm install decrunch
```

## Usage

### Promise Wrapper

Wrap any async task with the loading animation:

```typescript
import { whileDecrunching } from "./animation.js";

// Wrap any promise
const result = await whileDecrunching(
	fetch("https://api.example.com/data"),
	{
		// default options
		border: 0,
		fps: 25,
	},
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

### CLI

```shell
npx decrunch sleep 3
```

## API

### `whileDecrunching<T>(task: Promise<T>, options?: AnimationOptions): Promise<T>`

Runs a loading animation while waiting for a promise to resolve.

### `startDecrunching(options?: AnimationOptions): () => void`

Starts the animation and returns a function to stop it.

## Options

Both exported function accept the same options object:

### `option.border`

Type: `number`\
Default: 25

Border with on all sides.

### `option.fps`

Type: `number`\
Default: 25

Frames per second.

## License ©️

This work is licensed under [The MIT License](LICENSE).
