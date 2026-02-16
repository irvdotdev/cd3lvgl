export interface Asset {
  id: string;
  name: string;
  originalFile: File | null;
  originalDataUrl: string;
  convertedBlob: Blob | null;
  convertedDataUrl: string;
  width: number;
  height: number;
  format: 'rgb565';
  status: 'importing' | 'converting' | 'ready' | 'error';
  errorMessage?: string;
}
