import { rgbToRgb565 } from './rgb565';

export function encodeRgb565Bmp(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowSize = width * 2;
  const paddedRowSize = Math.ceil(rowSize / 4) * 4;
  const pixelDataSize = paddedRowSize * height;
  // 14 (file header) + 40 (DIB header) + 12 (color masks for BI_BITFIELDS) + pixels
  const maskSize = 12;
  const pixelDataOffset = 14 + 40 + maskSize;
  const fileSize = pixelDataOffset + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP file header (14 bytes)
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true); // reserved
  view.setUint32(10, pixelDataOffset, true);

  // DIB header (BITMAPINFOHEADER, 40 bytes)
  view.setUint32(14, 40, true); // header size
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true); // negative = top-down
  view.setUint16(26, 1, true); // color planes
  view.setUint16(28, 16, true); // bits per pixel
  view.setUint32(30, 3, true); // compression = BI_BITFIELDS
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true); // H resolution (ppm)
  view.setInt32(42, 2835, true); // V resolution (ppm)
  view.setUint32(46, 0, true); // colors in palette
  view.setUint32(50, 0, true); // important colors

  // Color masks for RGB565 (12 bytes)
  view.setUint32(54, 0xf800, true); // Red mask:   5 bits at [15:11]
  view.setUint32(58, 0x07e0, true); // Green mask: 6 bits at [10:5]
  view.setUint32(62, 0x001f, true); // Blue mask:  5 bits at [4:0]

  // Pixel data (RGB565, top-down)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const rgb565 = rgbToRgb565(r, g, b);
      const dstIdx = pixelDataOffset + y * paddedRowSize + x * 2;
      view.setUint16(dstIdx, rgb565, true);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}
