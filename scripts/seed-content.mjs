import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from '@babel/parser';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAdminApp } from '../server/firebase-admin.js';

const root = resolve(import.meta.dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const media = JSON.parse(await readFile(resolve(root, 'src/cloudinary-media.json'), 'utf8'));

async function declaration(file, name) {
  const source = await readFile(resolve(root, file), 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  for (const statement of ast.program.body) {
    const variables = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (variables?.type !== 'VariableDeclaration') continue;
    const found = variables.declarations.find((entry) => entry.id.name === name);
    if (found) return found.init;
  }
  throw new Error(`Could not find ${name} in ${file}`);
}

function keyOf(node) {
  return node.type === 'Identifier' ? node.name : node.value;
}

function valueOf(node) {
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral') return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(valueOf);
  if (node.type === 'ObjectExpression') {
    return Object.fromEntries(node.properties.map((property) => [keyOf(property.key), valueOf(property.value)]));
  }
  if (node.type === 'JSXFragment') {
    return node.children.filter((child) => child.type === 'JSXElement').map((child) => {
      const text = child.children.map((part) => part.type === 'JSXText' ? part.value : '').join(' ')
        .replace(/\s+/g, ' ').trim();
      return child.openingElement.name.name.match(/^h[1-6]$/) ? `## ${text}` : text;
    }).filter(Boolean).join('\n\n');
  }
  throw new Error(`Unsupported source value: ${node.type}`);
}

function asset(path) {
  return media[path]?.url || path;
}

const blogList = valueOf(await declaration('src/pages/BlogPage.jsx', 'BLOG_POSTS'));
const blogDetails = valueOf(await declaration('src/pages/BlogSingle.jsx', 'BLOG_DATA'));
const slugs = valueOf(await declaration('src/constants.js', 'SLUGS'));
const projectDetails = valueOf(await declaration('src/pages/WorkSingle.jsx', 'PROJECT_DATA'));

const posts = blogList.map((item) => ({
  slug: item.slug,
  title: item.title,
  excerpt: item.excerpt,
  category: item.category,
  body: blogDetails[item.slug]?.content || '',
  coverUrl: asset(item.img),
  status: 'published',
  publishedAt: Timestamp.fromDate(new Date(item.date)),
}));

const projects = projectDetails.map((item, index) => ({
  slug: slugs[index],
  title: `${item.title} ${item.title2}`.trim(),
  summary: item.tagline,
  industry: item.industry,
  projectType: 'Website',
  services: item.deliverables,
  featured: true,
  sortOrder: index,
  deliverables: item.deliverables,
  details: item.details,
  detailsContinued: item.detailsContinued,
  research: item.research,
  results: item.results,
  coverUrl: asset(item.image),
  galleryUrls: [item.img1, item.img2, item.img3].filter(Boolean).map(asset),
  status: 'published',
  publishedAt: Timestamp.fromDate(new Date(Date.UTC(2026, 0, 4 - index))),
}));

if (dryRun) {
  console.log(`Ready to seed ${posts.length} blogs and ${projects.length} projects.`);
  for (const item of [...posts, ...projects]) console.log(item.slug);
} else {
  const db = getFirestore(getAdminApp());
  for (const [type, items] of [['posts', posts], ['projects', projects]]) {
    for (const { slug, ...data } of items) {
      const reference = db.collection(type).doc(slug);
      if ((await reference.get()).exists) {
        console.log(`Skipped existing ${type}/${slug}`);
        continue;
      }
      await reference.create({ ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      console.log(`Created ${type}/${slug}`);
    }
  }
}
