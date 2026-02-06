import { defineCollection, z, type CollectionEntry } from 'astro:content';

export const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  author: z.string(),
  draft: z.boolean().optional(),
  featured: z.boolean().optional(),
  category: z.enum(['beef', 'pork', 'chicken']),
  cut: z.string(),
  method: z.enum(['smoke', 'grill', 'roast', 'braise']),
  pitTempF: z.number(),
  targetTempF: z.number(),
  finishTempF: z.number().optional(),
  prepMinutes: z.number().min(0).optional(),
  cookMinutes: z.number().min(0).optional(),
  restMinutes: z.number().min(0).optional(),
  totalMinutes: z.number().min(0).optional(),
  servings: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  equipment: z.array(z.string()).min(1),
  fuel: z.array(z.string()).min(1),
  wood: z.array(z.string()).optional(),
  altitudeNotes: z.string(),
  timingNotes: z.string().optional(),
  tags: z.array(z.string()).min(1),
  heroImage: z.string(),
  heroImageAlt: z.string().optional(),
  canonicalUrl: z.string().url(),
});

export const techniqueSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  author: z.string(),
  draft: z.boolean().optional(),
  featured: z.boolean().optional(),
  category: z.enum(['beef', 'pork', 'chicken']).optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  durationMinutes: z.number().min(0).optional(),
  keyTempsF: z.array(z.number()).optional(),
  altitudeNotes: z.string().optional(),
  tags: z.array(z.string()).min(1),
  heroImage: z.string(),
  heroImageAlt: z.string().optional(),
  canonicalUrl: z.string().url(),
});

const recipesCollection = defineCollection({
  type: 'content',
  schema: recipeSchema,
});

const techniquesCollection = defineCollection({
  type: 'content',
  schema: techniqueSchema,
});

export type RecipeFrontmatter = z.infer<typeof recipeSchema>;
export type RecipeEntry = CollectionEntry<'recipes'>;
export type TechniqueFrontmatter = z.infer<typeof techniqueSchema>;
export type TechniqueEntry = CollectionEntry<'techniques'>;

export const collections = {
  recipes: recipesCollection,
  techniques: techniquesCollection,
};
