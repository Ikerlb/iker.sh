import { defineCollection, z } from "astro:content";

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    name: z.string(),
    date: z.coerce.date(),
    size: z.string(),
    tags: z.array(z.string()).default([]),
    links: z.array(linkSchema).default([]),
    featured: z.boolean().optional(),
  }),
});

const reading = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    author: z.string(),
    year: z.number().int(),
    status: z.enum(["done", "reading", "abandoned"]).default("done"),
    href: z.string().url().optional(),
    note: z.string().optional(),
  }),
});

const about = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
    role: z.string(),
    motd: z.string().optional(),
  }),
});

export const collections = { projects, reading, about };
