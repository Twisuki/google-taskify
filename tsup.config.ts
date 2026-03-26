import { defineConfig } from "tsup";

export default defineConfig([
	{
		format: ['esm', 'cjs'],
		entry: ['src/index.ts'],
		outDir: 'dist',
		dts: {
			resolve: true,
			entry: "src/index.ts"
		},
		minify: true,
		sourcemap: false,
		shims: true,
		clean: true,
	}
]);
