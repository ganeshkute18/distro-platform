export async function compressImageToBase64(file: File, maxKb = 200): Promise<string> {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to initialize image canvas');

  const maxDimension = 1280;
  let { width, height } = imageBitmap;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  let quality = 0.9;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (estimateBase64SizeKb(dataUrl) > maxKb && quality > 0.35) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (estimateBase64SizeKb(dataUrl) > maxKb) {
    throw new Error(`Image too large after compression (>${maxKb}KB)`);
  }

  return dataUrl;
}

function estimateBase64SizeKb(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 0.75) / 1024);
}

