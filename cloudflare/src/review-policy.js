// Pure state-transition rules. No database writes or publication.
const allowed = {
  pending: new Set(["approve","reject"]),
  approved: new Set(["retract","correct"]),
  rejected: new Set(["correct"])
};
export function evaluateReviewAction(item, action, ownerVerified) {
  if (ownerVerified !== true) return {ok:false,error:"owner_required"};
  if (!item || !allowed[item.status]?.has(action))
    return {ok:false,error:"invalid_transition"};
  if (action === "approve" && (item.source_verified !== true ||
      item.rights_checked !== true || item.retracted === true))
    return {ok:false,error:"approval_requirements_missing"};
  if (action === "approve" && item.image_key && item.image_rights_checked !== true)
    return {ok:false,error:"image_rights_unconfirmed"};
  const status = action === "approve" ? "approved" :
    action === "reject" ? "rejected" : "pending";
  return {ok:true,nextStatus:status,retracted:action==="retract",
    requiresNewReview:action==="correct"};
}
