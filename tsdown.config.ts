import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node20',
		clean: isProduction,
		dts: isProduction,
		entry: {
			cli: 'src/index.ts',
			decrunch: 'src/decrunch.ts',
		},
		externals: [
			// ensure we always read the current version from the manifests
			'../deno.json',
			'../package.json',
		],
		format: 'esm',
		minify: isProduction,
		outDir: 'lib',
		platform: 'node',
	};
});
