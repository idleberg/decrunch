import { withLoadingAnimation } from './animation.ts';

// Example usage: Simple delay function
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Example usage: Simulated task
async function simulateTask(): Promise<string> {
	await delay(50000); // Simulate a 5-second task
	return 'Task completed!';
}

// Run the example
async function main() {
	console.log('Starting task with loading animation...\n');

	try {
		const result = await withLoadingAnimation(simulateTask(), {
			border: 1,
			fps: 30,
		});
		console.log(result);
	} catch (error) {
		console.error('Task failed:', error);
		process.exit(1);
	}
}

main();
