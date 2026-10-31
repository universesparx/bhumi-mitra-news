// Pure staging readiness validation. No Cloudflare API calls, deployment or writes.
const required=["AUTH_ENABLED","ACCESS_TEAM_DOMAIN","ACCESS_AUD","OWNER_SUB","EDITORIAL_ORIGIN"];
const flags=["NEWS_PUBLISHING_ENABLED","NEWS_COLLECTION_ENABLED","EDITORIAL_WRITES_ENABLED","EDITORIAL_IMAGE_WRITES_ENABLED"];
export function inspectStagingConfig(env={}, {requireImages=true}={}){
 const failures=[];
 for(const name of required)if(typeof env[name]!=="string"||!env[name].trim())failures.push("missing_"+name.toLowerCase());
 if(env.AUTH_ENABLED!=="true")failures.push("authentication_disabled");
 for(const name of flags)if(env[name]!=="false")failures.push("unsafe_flag_"+name.toLowerCase());
 for(const name of ["ACCESS_TEAM_DOMAIN","EDITORIAL_ORIGIN"]){
  try{
   const url=new URL(env[name]);
   if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||
      url.pathname!=="/"||!url.hostname.includes("."))
    failures.push("invalid_"+name.toLowerCase());
  }catch{failures.push("invalid_"+name.toLowerCase());}
 }
 if(env.ACCESS_TEAM_DOMAIN&&env.EDITORIAL_ORIGIN){
  try{if(new URL(env.ACCESS_TEAM_DOMAIN).origin===new URL(env.EDITORIAL_ORIGIN).origin)
   failures.push("access_and_editorial_origin_must_differ");}catch{}
 }
 if(!env.NEWS_DB?.prepare||!env.NEWS_DB?.batch)failures.push("missing_d1_binding");
 if(requireImages && (!env.NEWS_IMAGES?.put||!env.NEWS_IMAGES?.delete))failures.push("missing_private_r2_binding");
 if(!requireImages && env.EDITORIAL_IMAGE_WRITES_ENABLED!=="false")failures.push("image_writes_must_be_disabled");
 return {ready:failures.length===0,failures};
}
