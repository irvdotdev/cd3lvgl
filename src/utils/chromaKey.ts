import { CHROMA_KEY_R, CHROMA_KEY_G, CHROMA_KEY_B } from '../constants/display';

export function applyChromaKeyTransparency(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    if (
      data[i] === CHROMA_KEY_R &&
      data[i + 1] === CHROMA_KEY_G &&
      data[i + 2] === CHROMA_KEY_B
    ) {
      data[i + 3] = 0; // set alpha to 0
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
}

export function replaceTransparencyWithChromaKey(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) {
      data[i] = CHROMA_KEY_R;
      data[i + 1] = CHROMA_KEY_G;
      data[i + 2] = CHROMA_KEY_B;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
}
