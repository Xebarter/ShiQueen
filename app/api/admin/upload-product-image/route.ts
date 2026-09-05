import { NextRequest, NextResponse } from 'next/server';
import { uploadProductImageServer } from '@/lib/firebase/storage-server';

export const maxDuration = 30;

function statusForUploadError(message: string): number {
  if (
    message.includes('sign-in') ||
    message.includes('Admin access') ||
    message.includes('Supplier or admin') ||
    message.includes('only upload')
  ) {
    return 403;
  }
  if (
    message.includes('valid image') ||
    message.includes('too large') ||
    message.includes('8MB') ||
    message.includes('JPEG, PNG') ||
    message.includes('No image') ||
    message.includes('Product ID')
  ) {
    return 400;
  }
  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
    }

    const idToken = authHeader.slice('Bearer '.length);
    const formData = await request.formData();
    const file = formData.get('file');
    const productId = formData.get('productId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (typeof productId !== 'string' || !productId.trim()) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadProductImageServer(
      idToken,
      productId.trim(),
      file.name,
      file.type || 'application/octet-stream',
      buffer
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ShiQueen] upload-product-image:', error);
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: statusForUploadError(message) });
  }
}
