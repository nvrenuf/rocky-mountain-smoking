import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

type ImageSource = ImageMetadata | string;

const HERO_WIDTHS = [400, 760, 1200];
const HERO_FORMATS = ['avif', 'webp', 'jpg'] as const;
const HERO_QUALITY = 72;

export async function getHeroImage(src: ImageSource) {
  if (typeof src === 'string') return null;
  return getImage({
    src,
    widths: HERO_WIDTHS,
    formats: [...HERO_FORMATS],
    quality: HERO_QUALITY,
  });
}

export function getHeroFallbackSrcset(resolvedSrc: string) {
  return HERO_WIDTHS.map((width) => `${resolvedSrc} ${width}w`).join(', ');
}

export const heroImageSizes = '(min-width: 1024px) 760px, 100vw';
