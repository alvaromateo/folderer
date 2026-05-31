import esbuild from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import process from 'process';
import { builtinModules } from 'node:module';
import { sveltePreprocess } from 'svelte-preprocess';

const prod = process.argv[2] === 'production';

const context = await esbuild.context({
	entryPoints: ['src/main.ts'],
	bundle: true,
	plugins: [
		esbuildSvelte({
			compilerOptions: { css: 'injected' },
			preprocess: sveltePreprocess(),
		}),
	],
	external: [
		'obsidian',
		'electron',
		'@codemirror/autocomplete',
		'@codemirror/collab',
		'@codemirror/commands',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
		'@codemirror/state',
		'@codemirror/view',
		'@lezer/common',
		'@lezer/highlight',
		'@lezer/lr',
		...builtinModules,
	],
	format: 'cjs',
	target: 'es2018',
	logLevel: 'info',
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	outfile: 'dist/main.js',
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
