// ─────────────────────────────────────────────────────────────────────────────
// Holdings Service – Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type ItemStatus = 'available' | 'loaned' | 'reserved' | 'in_repair' | 'lost' | 'withdrawn';
export type ItemCollection = 'general' | 'reference' | 'rare' | 'periodicals' | 'digital';

export interface ItemDto {
  id: string;
  bibliographicRecordId: string;
  barcode: string;
  callNumber: string;
  collection: ItemCollection;
  location: string;
  status: ItemStatus;
  acquisitionDate: string | null;
  price: number | null;
}

export interface DigitalItemDto {
  id: string;
  bibliographicRecordId: string;
  licenseType: string;
  concurrentUsers: number;
  currentUsers: number;
  fileUrl: string;
}

export interface ItemAvailabilityDto {
  itemId: string;
  barcode: string;
  status: ItemStatus;
  location: string;
  dueDate: string | null;
}
