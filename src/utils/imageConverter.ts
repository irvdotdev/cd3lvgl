import { replaceTransparencyWithChromaKey } from './chromaKey';
import { quantizeImageToRgb565 } from './rgb565';
import { encodeRgb565Bmp } from './bmpEncoder';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/display';

export interface ConversionResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
}

export function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

export async function convertImageToRgb565(file: File): Promise<ConversionResult> {
  const img = await loadImageFromFile(file);
  let imageData = imageToImageData(img);

  // Replace transparent pixels with chroma key
  imageData = replaceTransparencyWithChromaKey(imageData);

  // Quantize to RGB565
  imageData = quantizeImageToRgb565(imageData);

  // Encode as BMP
  const blob = encodeRgb565Bmp(imageData);
  const dataUrl = URL.createObjectURL(blob);

  return {
    blob,
    dataUrl,
    width: img.width,
    height: img.height,
  };
}

export function checkImageDimensions(width: number, height: number): string[] {
  const warnings: string[] = [];
  if (width > SCREEN_WIDTH) {
    warnings.push(`Image width (${width}px) exceeds screen width (${SCREEN_WIDTH}px)`);
  }
  if (height > SCREEN_HEIGHT) {
    warnings.push(`Image height (${height}px) exceeds screen height (${SCREEN_HEIGHT}px)`);
  }
  return warnings;
}
