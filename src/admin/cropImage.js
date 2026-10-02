export async function createCroppedFile(imageUrl, file, crop, requirement) {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();

  const aspect = requirement.width / requirement.height;
  const width = Math.max(1, Math.min(2400, Math.floor(crop.width), Math.floor(crop.height * aspect)));
  const height = Math.max(1, Math.round(width / aspect));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image cropping is not available in this browser.');
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
  if (!blob) throw new Error('Could not create the cropped image. Please try again.');
  const extension = blob.type === 'image/webp' ? 'webp' : 'png';
  const stem = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${stem}-cropped.${extension}`, { type: blob.type });
}
