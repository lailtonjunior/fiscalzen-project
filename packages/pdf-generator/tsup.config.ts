import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
        'pdfkit',
        'bwip-js',
        'qrcode',
        '@fiscalzen/xml-parser'
    ],
});
