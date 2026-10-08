/**
 * Client-side file compressor.
 * Compresses images via HTML5 Canvas maintaining high visual quality while reducing byte size.
 * Smoothly handles all file types before upload.
 */
export async function compressImage(file, quality = 0.85, maxDimension = 3840) {
  if (!file || !file.type || !file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file; // Keep original for SVGs, animated GIFs, or non-images
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/png' && file.size > 2 * 1024 * 1024 ? 'image/jpeg' : file.type;

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
          } else {
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function compressFiles(fileList, onStep) {
  const files = Array.from(fileList || []);
  const result = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onStep) onStep(i + 1, files.length, file.name);

    if (file.type.startsWith('image/')) {
      const compressed = await compressImage(file);
      result.push(compressed);
    } else {
      // Short delay for stream buffer optimization
      await new Promise((r) => setTimeout(r, 40));
      result.push(file);
    }
  }

  return result;
}
