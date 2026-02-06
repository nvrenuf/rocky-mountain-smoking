import { getCollection } from 'astro:content';
import { BBQ_CATEGORIES } from '../data/bbqCategories';

export const prerender = true;

export async function GET({ site }: { site: URL | undefined }) {
  const base = (site ?? new URL('https://rockymountainsmoking.com')).toString().replace(/\/$/, '');
  const allRecipes = (await getCollection('recipes')).filter((recipe) => !recipe.data.draft);
  const allTechniques = (await getCollection('techniques')).filter((technique) => !technique.data.draft);

  const urls: string[] = [];
  const staticPaths = ['/', '/recipes/', '/techniques/', '/about/', '/contact/', '/blog/'];
  for (const path of staticPaths) {
    urls.push(renderUrl(base, path));
  }

  for (const category of BBQ_CATEGORIES) {
    urls.push(renderUrl(base, `/recipes/category/${category.key}/`));
  }

  for (const recipe of allRecipes) {
    urls.push(renderUrl(base, `/recipes/${recipe.slug}/`, recipe.data.date));
  }

  for (const technique of allTechniques) {
    urls.push(renderUrl(base, `/techniques/${technique.slug}/`, technique.data.date));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

function renderUrl(base: string, path: string, lastmod?: Date) {
  const url = new URL(path, base).toString();
  return `<url><loc>${url}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}` : ''}${lastmod ? '</lastmod>' : ''}</url>`;
}
