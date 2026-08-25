/**
 * Utility to calculate deterministic SHA-256 fingerprint for duplicate image detection
 */
export async function calculateFileHash(file: File | Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback: file size + name signature
    return `${(file as File).name || 'file'}-${file.size}`;
  }
}
