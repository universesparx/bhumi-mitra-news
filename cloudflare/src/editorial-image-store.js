// Owner-only image storage service. This is not an HTTP route.
// Requires a trusted, separately reviewed rights-evidence row before writing to R2.
import {validateImageUpload} from "./image-upload-validation.js";
export async function storeEditorialImage({db,bucket,request,itemId,evidenceId,ownerId}) {
 if(!db?.prepare || !bucket?.put || !bucket?.delete) throw Error("storage_unavailable");
 if(typeof ownerId!=="string" || !ownerId.trim()) throw Error("owner_required");
 if(typeof itemId!=="string" || !/^[A-Za-z0-9_-]{1,100}$/.test(itemId))
  throw Error("invalid_item_id");
 if(typeof evidenceId!=="string" || !/^[A-Za-z0-9_-]{1,100}$/.test(evidenceId))
  throw Error("invalid_evidence_id");
 const evidence=await db.prepare(
  "SELECT e.id FROM rights_evidence e JOIN editorial_items i ON i.id=e.item_id WHERE e.id=? AND e.item_id=? AND i.status='pending' AND length(trim(e.permission_reference))>0 AND lower(trim(e.permission_scope)) IN ('image','image_reuse') AND length(trim(e.permission_scope))>0"
 ).bind(evidenceId,itemId).first();
 if(!evidence)throw Error("rights_evidence_missing");
 const upload=await validateImageUpload(request,{rightsEvidenceId:evidenceId,rightsConfirmed:true});
 const key="editorial/"+itemId+"/"+crypto.randomUUID()+upload.extension;
 try {
  await bucket.put(key,upload.bytes,{httpMetadata:{contentType:upload.mime},
   customMetadata:{evidenceId,uploadedBy:ownerId}});
 }catch{throw Error("image_storage_failed");}
 try {
  const result=await db.prepare(
   "UPDATE editorial_items SET image_key=?,version=version+1,updated_at=? WHERE id=? AND status='pending' AND image_key IS NULL AND EXISTS (SELECT 1 FROM rights_evidence WHERE id=? AND item_id=? AND lower(trim(permission_scope)) IN ('image','image_reuse'))"
  ).bind(key,new Date().toISOString(),itemId,evidenceId).run();
  if(result?.meta?.changes!==1)throw Error("image_attachment_conflict");
 }catch(error){
  try{await bucket.delete(key);}catch{throw Error("image_cleanup_failed");}
  throw error;
 }
 return {imageKey:key,mime:upload.mime,size:upload.bytes.byteLength};
}
