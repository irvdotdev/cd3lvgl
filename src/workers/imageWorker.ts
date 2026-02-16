import { rgbToRgb565, rgb565ToRgb } from '../utils/rgb565';
import { CHROMA_KEY_R, CHROMA_KEY_G, CHROMA_KEY_B } from '../constants/display';

interface WorkerMessage {
  type: 'convertToRgb565';
  imageData: ImageData;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, imageData } = e.data;

  if (type === 'convertToRgb565') {
    const data = new Uint8ClampedArray(imageData.data);

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];

      // Replace transparent pixels with chroma key
      if (a < 128) {
        data[i] = CHROMA_KEY_R;
        data[i + 1] = CHROMA_KEY_G;
        data[i + 2] = CHROMA_KEY_B;
        data[i + 3] = 255;
        continue;
      }

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const rgb565 = rgbToRgb565(r, g, b);
      const [qr, qg, qb] = rgb565ToRgb(rgb565);
      data[i] = qr;
      data[i + 1] = qg;
      data[i + 2] = qb;
    }

    const result = new ImageData(data, imageData.width, imageData.height);
    self.postMessage({ type: 'converted', imageData: result });
  }
};
