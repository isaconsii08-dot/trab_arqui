// Port: what the Circulation Service needs from the Holdings Service
export interface ItemSnapshot {
  id: string;
  barcode: string;
  title?: string;
  status: string;
  location: string;
}

export interface IHoldingsServiceClient {
  reserveItem(barcode: string): Promise<ItemSnapshot | null>;
  releaseItem(barcode: string): Promise<void>;
  getItemByBarcode(barcode: string): Promise<ItemSnapshot | null>;
}

export const HOLDINGS_SERVICE_CLIENT = Symbol('IHoldingsServiceClient');
