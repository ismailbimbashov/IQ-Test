import { defineConfig, type Plugin } from 'vitest/config';

/**
 * Content-Security-Policy injected into index.html for production builds only.
 * The dev server needs inline <style> injection for HMR, so it is left out there.
 * Keep in sync with docker/nginx.conf, which sends the same policy as a header.
 */
export const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

function cspMeta(): Plugin {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  // Relative base so the build works on GitHub Pages sub-paths, Docker and file hosting alike.
  base: './',
  plugins: [cspMeta()],
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
  },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/data/**', 'src/config.ts'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
