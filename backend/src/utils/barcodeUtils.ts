/**
 * SKU and Barcode utility functions
 */

/**
 * Generate a unique SKU based on product information
 */
export function generateSku(options: {
  productName: string;
  brand?: string;
  categoryName?: string;
  customPrefix?: string;
}): string {
  const { productName, brand, categoryName, customPrefix } = options;

  // Determine prefix
  let prefix = customPrefix;

  if (!prefix) {
    if (brand) {
      prefix = brand.slice(0, 3).toUpperCase();
    } else if (categoryName) {
      prefix = categoryName.slice(0, 3).toUpperCase();
    } else {
      prefix = productName.slice(0, 3).toUpperCase();
    }
  }

  // Clean prefix - remove non-alphanumeric characters
  prefix = prefix.replace(/[^A-Z0-9]/g, '');

  // Ensure prefix is at least 2 characters
  if (prefix.length < 2) {
    prefix = 'PRD';
  }

  // Generate unique suffix with timestamp + random
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');

  return `${prefix}-${timestamp}${random}`;
}

/**
 * Validate barcode format and checksum
 */
export function validateBarcode(barcode: string): {
  isValid: boolean;
  type?: BarcodeType;
  checksum?: boolean;
  message?: string;
} {
  if (!barcode || typeof barcode !== 'string') {
    return {
      isValid: false,
      message: 'Barcode must be a non-empty string',
    };
  }

  // Remove any spaces or dashes
  const cleanBarcode = barcode.replace(/[\s-]/g, '');

  // Check if it's numeric (for UPC/EAN codes)
  const isNumeric = /^\d+$/.test(cleanBarcode);

  // UPC-A (12 digits)
  if (cleanBarcode.length === 12 && isNumeric) {
    return {
      isValid: true,
      type: BarcodeType.UPC_A,
      checksum: validateUpcChecksum(cleanBarcode),
    };
  }

  // EAN-13 (13 digits)
  if (cleanBarcode.length === 13 && isNumeric) {
    return {
      isValid: true,
      type: BarcodeType.EAN_13,
      checksum: validateEan13Checksum(cleanBarcode),
    };
  }

  // EAN-8 (8 digits)
  if (cleanBarcode.length === 8 && isNumeric) {
    return {
      isValid: true,
      type: BarcodeType.EAN_8,
      checksum: validateEan8Checksum(cleanBarcode),
    };
  }

  // Code 128 (variable length, alphanumeric)
  if (cleanBarcode.length >= 1 && cleanBarcode.length <= 48) {
    return {
      isValid: true,
      type: BarcodeType.CODE_128,
      checksum: true, // Code 128 has internal checksum
    };
  }

  // Code 39 (variable length, specific character set)
  if (/^[A-Z0-9\-. $/+%*]+$/.test(cleanBarcode) && cleanBarcode.length <= 43) {
    return {
      isValid: true,
      type: BarcodeType.CODE_39,
      checksum: true, // Code 39 can have optional checksum
    };
  }

  return {
    isValid: false,
    message: 'Invalid barcode format',
  };
}

/**
 * Generate a random barcode for testing/internal use
 */
export function generateBarcode(type: BarcodeType = BarcodeType.EAN_13): string {
  switch (type) {
    case BarcodeType.UPC_A:
      return generateUpcA();
    case BarcodeType.EAN_13:
      return generateEan13();
    case BarcodeType.EAN_8:
      return generateEan8();
    case BarcodeType.CODE_128:
      return generateCode128();
    default:
      return generateEan13();
  }
}

// Barcode types enum
export enum BarcodeType {
  UPC_A = 'UPC-A',
  UPC_E = 'UPC-E',
  EAN_13 = 'EAN-13',
  EAN_8 = 'EAN-8',
  CODE_128 = 'CODE-128',
  CODE_39 = 'CODE-39',
  ITF = 'ITF',
  MSI = 'MSI',
}

// Helper functions for checksum validation

function validateUpcChecksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

function validateEan13Checksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

function validateEan8Checksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

// Helper functions for barcode generation

function generateUpcA(): string {
  // Generate 11 random digits
  let digits = '';
  for (let i = 0; i < 11; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }

  // Calculate check digit
  const digitArray = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < digitArray.length; i++) {
    sum += digitArray[i] * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return digits + checkDigit;
}

function generateEan13(): string {
  // Generate 12 random digits
  let digits = '';
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }

  // Calculate check digit
  const digitArray = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < digitArray.length; i++) {
    sum += digitArray[i] * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return digits + checkDigit;
}

function generateEan8(): string {
  // Generate 7 random digits
  let digits = '';
  for (let i = 0; i < 7; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }

  // Calculate check digit
  const digitArray = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < digitArray.length; i++) {
    sum += digitArray[i] * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return digits + checkDigit;
}

function generateCode128(): string {
  // Generate alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const length = Math.floor(Math.random() * 10) + 8; // 8-18 characters

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
