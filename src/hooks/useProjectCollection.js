import { useMemo } from 'react';
import { SLUGS, WORKS } from '../constants';
import { usePublishedContent } from './usePublishedContent';
import { homeProjects, orderedProjects } from '../../shared/content-layout';

export function useProjectCollection() {
  const { items, managedSlugs, loading } = usePublishedContent('projects');
  return useMemo(() => {
    const managed = new Set(managedSlugs);
    const projects = orderedProjects([
      ...items.map((project) => ({
        ...project,
        img: project.coverUrl || project.galleryUrls?.[0],
        desc: project.summary,
        deliverables: (project.deliverables || []).join('\n'),
      })),
      ...WORKS.map((work, index) => ({ ...work, slug: SLUGS[index], featured: true, sortOrder: index }))
        .filter((work) => !managed.has(work.slug)),
    ]).map((project, index) => ({ ...project, activeDot: index % 4 }));
    return { projects, featuredProjects: homeProjects(projects), loading };
  }, [items, managedSlugs, loading]);
}
