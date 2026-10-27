async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

/** Redimensiona uma imagem para a largura máxima informada (JPEG em data URL). */
export async function resizeImage(src: string, width: number): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(width, image.naturalWidth);
  canvas.height = Math.round((image.naturalHeight / image.naturalWidth) * canvas.width);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/** Recorta o centro da imagem em um quadrado (avatar). */
export async function cropSquare(src: string, size = 256): Promise<string> {
  const image = await loadImage(src);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas
    .getContext('2d')!
    .drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
  return canvas.toDataURL('image/jpeg', 0.88);
}
