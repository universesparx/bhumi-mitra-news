// Validation policy for a future authenticated R2 upload endpoint.
// This module never writes to R2. File extension and claimed MIME are not proof.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MIME = new Map([
  ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]
]);
function hasSignature(bytes, mime) {
  if (mime === "image/jpeg") return bytes.length >= 4 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8 &&
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 &&
    bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 &&
    bytes[6] === 26 && bytes[7] === 10;
  if (mime === "image/webp") return bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0,4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  return false;
}
export function validateImageCandidate({mime, size, firstBytes, rightsConfirmed}) {
  if (!MIME.has(mime)) return {ok:false, error:"unsupported_image_type"};
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_IMAGE_BYTES)
    return {ok:false, error:"invalid_image_size"};
  if (rightsConfirmed !== true) return {ok:false, error:"image_rights_unconfirmed"};
  if (!(firstBytes instanceof Uint8Array) || !hasSignature(firstBytes, mime))
    return {ok:false, error:"invalid_image_signature"};
  return {ok:true, extension:MIME.get(mime)};
}
