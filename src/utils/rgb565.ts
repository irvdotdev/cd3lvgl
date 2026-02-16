import { CHROMA_KEY_R, CHROMA_KEY_G, CHROMA_KEY_B } from '../constants/display';

export function rgbToRgb565(r: number, g: number, b: number): number {
  const r5 = (r >> 3) & 0x1f;
  const g6 = (g >> 2) & 0x3f;
  const b5 = (b >> 3) & 0x1f;
  return (r5 << 11) | (g6 << 5) | b5;
}

export function rgb565ToRgb(value: number): [number, number, number] {
  const r5 = (value >> 11) & 0x1f;
  const g6 = (value >> 5) & 0x3f;
  const b5 = value & 0x1f;
  return [
    (r5 << 3) | (r5 >> 2),
    (g6 << 2) | (g6 >> 4),
    (b5 << 3) | (b5 >> 2),
  ];
}

export function isChromaKey(r: number, g: number, b: number): boolean {
  return r === CHROMA_KEY_R && g === CHROMA_KEY_G && b === CHROMA_KEY_B;
}

export function quantizeImageToRgb565(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const rgb565 = rgbToRgb565(r, g, b);
    const [qr, qg, qb] = rgb565ToRgb(rgb565);
    data[i] = qr;
    data[i + 1] = qg;
    data[i + 2] = qb;
    // preserve alpha
  }
  return new ImageData(data, imageData.width, imageData.height);
}
