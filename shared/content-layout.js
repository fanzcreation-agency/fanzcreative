import { contentSeconds } from './content.js';

export const PAGE_SIZE = 12;

export function latestContent(items) {
  return [...items].sort((a, b) => {
    const date = (item) => contentSeconds(item.publishedAt) || Date.parse(item.date || '') / 1000 || 0;
    return date(b) - date(a) || a.slug.localeCompare(b.slug);
  });
}

// Existing projects remain selected until an editor explicitly changes the setting.
export function isFeatured(project) {
  return project.featured === true || project.featured === undefined;
}

export function orderedProjects(items) {
  return latestContent(items).sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a))
    || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function homeProjects(items) {
  return orderedProjects(items).filter(isFeatured).slice(0, 4);
}

export function projectServices(project) {
  if (Array.isArray(project.services) && project.services.length) return project.services;
  const deliverables = project.deliverables;
  return (Array.isArray(deliverables) ? deliverables : String(deliverables || '').replace(/\n/g, ' ').split(','))
    .map((value) => value.trim()).filter(Boolean);
}

export function filterProjects(items, { industry = '', service = '', projectType = '' } = {}) {
  const matches = (a, b) => String(a || '').trim().toLowerCase() === b.trim().toLowerCase();
  return items.filter((item) => (!industry || matches(item.industry, industry))
    && (!service || projectServices(item).some((value) => matches(value, service)))
    && (!projectType || matches(item.projectType, projectType)));
}

export function filterOptions(values) {
  const unique = new Map();
  for (const value of values) {
    const label = String(value || '').trim();
    if (label && !unique.has(label.toLowerCase())) unique.set(label.toLowerCase(), label);
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}
