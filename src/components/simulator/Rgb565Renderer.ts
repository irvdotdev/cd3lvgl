import { rgbToRgb565, rgb565ToRgb, isChromaKey } from '../../utils/rgb565';
import { SCREEN_WIDTH, SCREEN_HEIGHT, isInsideDisplay } from '../../constants/display';

export function renderSceneToRgb565(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  backgroundColor: string
) {
  const sourceCtx = sourceCanvas.getContext('2d');
  const targetCtx = targetCanvas.getContext('2d');
  if (!sourceCtx || !targetCtx) return;

  targetCanvas.width = SCREEN_WIDTH;
  targetCanvas.height = SCREEN_HEIGHT;

  // Get source pixels
  const sourceData = sourceCtx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  const targetData = targetCtx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Parse background color
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 1;
  bgCanvas.height = 1;
  const bgCtx = bgCanvas.getContext('2d');
  if (!bgCtx) return;
  bgCtx.fillStyle = backgroundColor;
  bgCtx.fillRect(0, 0, 1, 1);
  const bgPixel = bgCtx.getImageData(0, 0, 1, 1).data;

  for (let i = 0; i < sourceData.data.length; i += 4) {
    const px = (i / 4) % SCREEN_WIDTH;
    const py = Math.floor(i / 4 / SCREEN_WIDTH);

    // Outside D-shape: transparent
    if (!isInsideDisplay(px, py)) {
      targetData.data[i] = 0;
      targetData.data[i + 1] = 0;
      targetData.data[i + 2] = 0;
      targetData.data[i + 3] = 0;
      continue;
    }

    const r = sourceData.data[i];
    const g = sourceData.data[i + 1];
    const b = sourceData.data[i + 2];
    const a = sourceData.data[i + 3];

    let finalR: number, finalG: number, finalB: number;

    if (a < 128) {
      finalR = bgPixel[0];
      finalG = bgPixel[1];
      finalB = bgPixel[2];
    } else if (isChromaKey(r, g, b)) {
      const isLight = ((Math.floor(px / 8) + Math.floor(py / 8)) % 2) === 0;
      finalR = isLight ? 200 : 160;
      finalG = isLight ? 200 : 160;
      finalB = isLight ? 200 : 160;
    } else {
      finalR = r;
      finalG = g;
      finalB = b;
    }

    // Quantize through RGB565
    const rgb565 = rgbToRgb565(finalR, finalG, finalB);
    const [qr, qg, qb] = rgb565ToRgb(rgb565);

    targetData.data[i] = qr;
    targetData.data[i + 1] = qg;
    targetData.data[i + 2] = qb;
    targetData.data[i + 3] = 255;
  }

  targetCtx.putImageData(targetData, 0, 0);
}
