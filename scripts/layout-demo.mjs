import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminStore } from '../server/firebase-admin.js';
import { prepareContent } from '../shared/content.js';

export const DEMO_BATCH = 'layout-demo-v1';
const OWNER = 'fanzcreative-layout-demo';
const root = resolve(import.meta.dirname, '..');

const blogTopics = [
  ['Design', 'A Clearer Product Page for Mobile Shoppers', 'blog_ui_ux'],
  ['Technology', 'Automating Repetitive Tasks Without Losing the Human Touch', 'blog_ai_automation'],
  ['Development', 'Planning a Website That Can Grow With Your Business', 'blog_web_dev'],
  ['Branding', 'Building a Visual Identity That Works Across Every Channel', 'blog_brand_identity'],
  ['Development', 'Making Your Website Faster With Better Image Choices', 'blog_web_performance'],
  ['Motion', 'Small Animations That Make Interfaces Easier to Understand', 'blog_motion_design'],
  ['Design', 'Designing Navigation Around the Questions Visitors Actually Ask', 'blog_ui_ux'],
  ['Technology', 'Where Automation Helps a Small Creative Team', 'blog_ai_automation'],
  ['Development', 'Reusable Components for a Consistent Digital Experience', 'blog_web_dev'],
  ['Branding', 'Turning a Brand Strategy Into a Practical Design System', 'blog_brand_identity'],
  ['Development', 'A Practical Checklist for Launching a Reliable Website', 'blog_web_performance'],
  ['Motion', 'Using Motion to Guide Attention in a Busy Interface', 'blog_motion_design'],
  ['Design', 'Improving the Checkout Journey One Decision at a Time', 'blog_ui_ux'],
  ['Technology', 'Choosing Useful Tools for Everyday Content Workflows', 'blog_ai_automation'],
  ['Development', 'Content Layouts That Stay Readable as Your Library Grows', 'blog_web_dev'],
  ['Branding', 'Keeping Your Brand Recognizable on Small Screens', 'blog_brand_identity'],
  ['Development', 'Balancing High Quality Photography With Page Speed', 'blog_web_performance'],
  ['Motion', 'Designing Transitions That Respect Reduced Motion Preferences', 'blog_motion_design'],
  ['Design', 'Testing a Website With Real Content and Different Screen Sizes', 'blog_ui_ux'],
  ['Branding', 'Writing Clear Guidelines for a Growing Brand', 'blog_brand_identity'],
];

const projectNames = [
  'Luma Skincare Store', 'Northline Fashion Platform', 'Studio Vale Brand Experience', 'Fieldwork Apparel Shop',
  'Bloom Beauty Collection', 'Forma Retail Website', 'Maison Creative Identity', 'Ridge Outdoor Store',
  'Aster Wellness Platform', 'Mode Seasonal Campaign', 'Atelier Digital Experience', 'Trail Sustainable Apparel',
  'Pureline Product Launch', 'Thread Modern Commerce', 'Edition Editorial Website', 'Summit Outdoor Collection',
  'Glow Beauty Website', 'Urban Retail Identity', 'Canvas Brand Campaign', 'Coast Apparel Platform',
];
const projectTemplates = [
  ['cora-beauty', 'cora-beauty-ecommerce-mockup', 'Beauty', 'Website', ['Web design', 'Development']],
  ['revolution', 'revolution-fashion-store-mockup', 'Fashion', 'E-commerce', ['Web design', 'Development']],
  ['marble', 'marble-fashion-ecommerce-mockup', 'Creative services', 'Brand identity', ['Branding', 'Motion design']],
  ['mojave', 'mojave-clothing-store-mockup', 'Outdoor apparel', 'E-commerce', ['Web design', 'Branding']],
];

export function demoTargets() {
  return ['posts', 'projects'].flatMap((type) => Array.from({ length: 20 }, (_, index) => ({
    type,
    slug: `dummy-layout-v1-${type === 'posts' ? 'blog' : 'project'}-${String(index + 1).padStart(2, '0')}`,
  })));
}

export function ownsDemoRecord(type, slug, data) {
  return data?.dummyOwner === OWNER && data?.dummyBatch === DEMO_BATCH
    && demoTargets().some((target) => target.type === type && target.slug === slug);
}

export function buildDemoRecords(media, now = Date.now()) {
  const image = (path) => {
    const url = media[path]?.url;
    if (!url?.startsWith('https://res.cloudinary.com/')) throw new Error(`Missing Cloudinary image: ${path}`);
    return url;
  };
  return demoTargets().map(({ type, slug }, position) => {
    const index = position % 20;
    const number = String(index + 1).padStart(2, '0');
    let input;
    if (type === 'posts') {
      const [category, topic, asset] = blogTopics[index];
      input = {
        title: `Dummy ${number}: ${topic}`, category, status: 'published',
        excerpt: index % 2
          ? 'Explore practical choices that help a growing brand keep its digital experience clear, useful, and consistent across different devices.'
          : 'Practical ideas for creating a clearer digital experience for your customers.',
        coverUrl: image(`/assets/images/blog/${asset}.webp`),
        body: `This is temporary demo article ${number}, created to check the blog layout. It can be edited in the admin panel and removed using the layout demo cleanup command.\n\n## ${topic}\n\nStart with the people using the website. Review the questions they bring, the information they need, and the actions they want to complete. A clear structure helps visitors find the right content without unnecessary steps.\n\n## Put the content first\n\nUse realistic titles, useful supporting copy, and images with a consistent ratio. Check short and long paragraphs together so the design works with more than one example. Keep related ideas together and give each section enough space to stay readable.\n\n## Check the experience on different devices\n\nReview the page on a phone, tablet, and laptop. Confirm that images load, headings wrap naturally, and links open the expected page. Try Load More and return to the listing to make sure the experience remains comfortable as the content library grows.`,
      };
    } else {
      const [asset, cover, industry, projectType, services] = projectTemplates[index % projectTemplates.length];
      input = {
        title: `Dummy ${number}: ${projectNames[index]}`, status: 'published', industry, projectType, services,
        summary: index % 2 ? 'A complete digital experience combining clear product storytelling, responsive layouts, and an accessible shopping journey.' : 'A focused brand and website experience built around the customer journey.',
        deliverables: [...services, 'Responsive layouts'],
        details: `Temporary demo project ${number} for testing the portfolio layout. ${projectNames[index]} brings product imagery, clear navigation, and a considered content structure together in one digital experience.\n\nThe project covers the main customer journey, from the first impression through browsing and a clear final action. Every page is designed to work across desktop and mobile screens.`,
        detailsContinued: 'The visual system uses consistent typography, spacing, and photography. Reusable components keep the pages connected while allowing different content lengths and formats.',
        research: 'We reviewed the audience, grouped related content, and tested the page structure with realistic product and brand information. Early feedback helped simplify navigation and clarify the primary actions.',
        results: 'This demo includes a cover image and three gallery images, plus industry, service, and type values for testing project filters. The first four demo projects are featured to check the home selection.',
        coverUrl: image(`/assets/images/section/${cover}.webp`),
        galleryUrls: [1, 2, 3].map((slot) => image(`/assets/images/section/${asset}-${slot}.webp`)),
        featured: index < 4,
        sortOrder: index < 4 ? 0 : index,
      };
    }
    return { type, slug, data: {
      ...prepareContent(type, input),
      dummyOwner: OWNER,
      dummyBatch: DEMO_BATCH,
      createdAt: Timestamp.fromMillis(now),
      updatedAt: Timestamp.fromMillis(now),
      publishedAt: Timestamp.fromMillis(now - index * 60000),
    } };
  });
}

async function run() {
  const [action, ...flags] = process.argv.slice(2);
  if (!['add', 'delete', 'status'].includes(action) || flags.some((flag) => flag !== '--dry-run')) {
    throw new Error('Usage: node scripts/layout-demo.mjs <add|delete|status> [--dry-run]');
  }
  if (existsSync(resolve(root, '.env.local'))) process.loadEnvFile(resolve(root, '.env.local'));
  const dryRun = flags.includes('--dry-run');
  const records = action === 'add'
    ? buildDemoRecords(JSON.parse(await readFile(resolve(root, 'src/cloudinary-media.json'), 'utf8')))
    : demoTargets();
  if (action === 'add' && dryRun) {
    console.log(`Preview: 20 published blogs and 20 published projects in batch ${DEMO_BATCH}.`);
    console.log('Four projects are featured. Existing Cloudinary images are reused.');
    return;
  }

  const store = getAdminStore();
  try {
    if (store.projectId !== 'fanzcreative-1bf9e') throw new Error('This demo script only supports the configured FanzCreative Firebase project.');
    const references = records.map(({ type, slug }) => store.collection(type).doc(slug));
    // Read and validate the complete batch before any write, including on transaction retries.
    const result = await store.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(...references);
      const counts = { posts: 0, projects: 0, existing: 0, skipped: 0 };
      snapshots.forEach((snapshot, index) => {
        const { type, slug } = records[index];
        if (snapshot.exists && !ownsDemoRecord(type, slug, snapshot.data()) && action === 'add') {
          throw new Error(`Refusing to overwrite unrelated content at ${type}/${slug}. No records were added.`);
        }
      });
      snapshots.forEach((snapshot, index) => {
        const { type, slug, data } = records[index];
        const owned = snapshot.exists && ownsDemoRecord(type, slug, snapshot.data());
        if (action === 'add') {
          if (snapshot.exists) counts.existing++;
          else { transaction.create(references[index], data); counts[type]++; }
        } else if (owned) {
          counts[type]++;
          if (action === 'delete' && !dryRun) transaction.delete(references[index]);
        } else if (snapshot.exists) counts.skipped++;
      });
      return counts;
    });
    const verb = action === 'add' ? 'Added' : action === 'status' ? 'Found' : dryRun ? 'Would delete' : 'Deleted';
    console.log(`${verb} ${result.posts} dummy blogs and ${result.projects} dummy projects (${DEMO_BATCH}).`);
    if (result.existing) console.log(`Kept ${result.existing} existing demo records without overwriting edits.`);
    if (result.skipped) console.log(`Skipped ${result.skipped} records without matching demo ownership.`);
    if (action === 'add') console.log('Refresh /blog, /works, and /admin to review. Cleanup: npm run demo:delete');
    if (action === 'delete') console.log('Shared images and unrelated content were left untouched.');
  } finally {
    await store.terminate();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
