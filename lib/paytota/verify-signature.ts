import crypto from 'crypto';

export function verifyPaytotaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  publicKeyPem: string
): boolean {
  if (!signatureHeader || !publicKeyPem.trim()) {
    return false;
  }

  try {
    const publicKey = crypto.createPublicKey(publicKeyPem);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(publicKey, Buffer.from(signatureHeader, 'base64'));
  } catch {
    return false;
  }
}
