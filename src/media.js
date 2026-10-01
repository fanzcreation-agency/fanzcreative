import manifest from './cloudinary-media.json';

export const videoMedia = {
  promo: manifest['/assets/videos/promo-reel.mp4'],
  mariana: manifest['/assets/videos/mariana.webm'],
  gideon: manifest['/assets/videos/gideon.webm'],
  nadia: manifest['/assets/videos/nadia.webm'],
};

export function mediaUrl(localPath) {
  return manifest[localPath]?.url || localPath;
}
