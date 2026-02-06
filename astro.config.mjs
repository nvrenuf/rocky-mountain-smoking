import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { visualizer } from 'rollup-plugin-visualizer';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [
    tailwind({ config: { applyBaseStyles: false } }),
    react(),
  ],
  vite: {
    plugins: [
      ...(process.env.ANALYZE_BUNDLE
        ? [
            visualizer({
              filename: 'dist/bundle-report.html',
              template: 'treemap',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
  },
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
    ],
  },
});
