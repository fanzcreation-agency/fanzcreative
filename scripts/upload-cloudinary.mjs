import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const assetsRoot = join(root, 'public', 'assets');
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

function cloudFolder(localPath) {
  const parts = relative(assetsRoot, localPath).split(sep);
  if (parts[0] === 'videos') {
    return parts[1] === 'promo-reel.mp4'
      ? 'fanzcreative/videos/hero'
      : 'fanzcreative/videos/testimonials';
  }
  if (parts[1] === 'blog') return 'fanzcreative/blog';
  if (parts[1] === 'section') {
    const project = ['cora-beauty', 'revolution', 'marble', 'mojave']
      .find((prefix) => parts[2].startsWith(prefix));
    if (project) return `fanzcreative/projects/${project}`;
  }
  return `fanzcreative/assets/${parts.slice(1, -1).join('/') || 'general'}`;
}

async function upload(localPath) {
  const isVideo = localPath.includes(`${sep}videos${sep}`);
  const resourceType = isVideo ? 'video' : 'image';
  const filename = basename(localPath);
  const extension = extname(filename).toLowerCase();
  const body = new FormData();
  body.append('file', new Blob([await readFile(localPath)]), filename);
  body.append('folder', cloudFolder(localPath));
  body.append('public_id', filename.slice(0, -extension.length));
  body.append('overwrite', 'true');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}` },
    body,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${filename}: ${result.error?.message || response.status}`);

  const localUrl = `/assets/${relative(assetsRoot, localPath).split(sep).join('/')}`;
  const transform = isVideo ? 'f_auto:video/q_auto' : extension === '.svg' ? '' : 'f_auto/q_auto';
  const url = transform
    ? result.secure_url.replace('/upload/', `/upload/${transform}/`)
    : result.secure_url;
  const poster = isVideo
    ? `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_960/q_auto/f_auto/v${result.version}/${result.public_id}.jpg`
    : undefined;
  return [localUrl, { url, ...(poster ? { poster } : {}) }];
}

const files = [
  ...await listFiles(join(assetsRoot, 'images')),
  ...await listFiles(join(assetsRoot, 'videos')),
].filter((path) => !path.endsWith(`${sep}cursor-close.svg`));

const manifest = {};
for (const file of files) {
  const [localUrl, remote] = await upload(file);
  manifest[localUrl] = remote;
  process.stdout.write(`Uploaded ${localUrl}\n`);
}

await writeFile(join(root, 'src', 'cloudinary-media.json'), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Saved ${Object.keys(manifest).length} media URLs.\n`);
