// Private image upload validation. Not wired to a route and cannot publish images.
import {validateImageCandidate,MAX_IMAGE_BYTES} from "./image-policy.js";
const TYPES=new Set(["image/jpeg","image/png","image/webp"]);
export async function validateImageUpload(request,{rightsEvidenceId,rightsConfirmed}={}) {
 if(!TYPES.has(request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()))
  throw Error("unsupported_image_type");
 if(typeof rightsEvidenceId!=="string"||
    !/^[A-Za-z0-9_-]{1,100}$/.test(rightsEvidenceId)||rightsConfirmed!==true)
  throw Error("image_rights_unconfirmed");
 const declared=request.headers.get("content-length");
 if(declared!==null&&(!/^[0-9]+$/.test(declared)||Number(declared)>MAX_IMAGE_BYTES))
  throw Error("invalid_image_size");
 if(!request.body)throw Error("invalid_image_size");
 const reader=request.body.getReader();const chunks=[];let size=0;
 try {
  while(true){
   const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;
   if(size>MAX_IMAGE_BYTES){await reader.cancel();throw Error("invalid_image_size");}
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const mime=request.headers.get("content-type").split(";")[0].trim().toLowerCase();
 const validation=validateImageCandidate({
  mime,size,firstBytes:bytes.subarray(0,16),rightsConfirmed});
 if(!validation.ok)throw Error(validation.error);
 return {bytes,mime,extension:validation.extension,rightsEvidenceId};
}
