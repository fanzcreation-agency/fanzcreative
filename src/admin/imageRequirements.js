export const IMAGE_REQUIREMENTS = {
  coverUrl: { label: 'Cover image', width: 16, height: 9, example: '1600 x 900' },
  gallery1: { label: 'Gallery image 1', width: 3, height: 2, example: '1200 x 800' },
  gallery2: { label: 'Gallery image 2', width: 3, height: 4, example: '600 x 800' },
  gallery3: { label: 'Gallery image 3', width: 4, height: 5, example: '800 x 1000' },
};

export function gallerySlots(value) {
  const urls = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [];
  return Array.from({ length: 3 }, (_, index) => typeof urls[index] === 'string' ? urls[index].trim() : '');
}

export function imageRatioError(requirement, width, height) {
  const actual = width / height;
  const expected = requirement.width / requirement.height;
  if (width > 0 && height > 0 && Math.abs(actual - expected) / expected <= 0.05) return '';
  return `${requirement.label} must be ${requirement.width}:${requirement.height} (for example ${requirement.example}). Selected image is ${width} x ${height}. Choose an image with the required ratio to avoid cropping.`;
}

export function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image. Choose a valid JPG, PNG, WebP or AVIF file.'));
    };
    image.src = url;
  });
}
