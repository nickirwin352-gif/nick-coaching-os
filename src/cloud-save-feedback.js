export function cloudSaveFeedback(value, online=true){
  const text=String(value||'').toLowerCase();
  if(!online||/offline|not available|local only/.test(text))return {main:'Saved on this device',sub:'Cloud backup is not confirmed. Connect and sync before switching devices.',state:'error'};
  if(/fail|error|retry/.test(text))return {main:'Saved on this device',sub:'Cloud save needs retry. Backup is not confirmed.',state:'error'};
  if(/syncing|saving|pending/.test(text))return {main:'Saved on this device',sub:'Cloud sync is in progress.',state:'syncing'};
  if(/saved to firebase|saved to cloud|cloud synced|cloud sync complete/.test(text))return {main:'Saved everywhere',sub:'Local save complete · cloud sync complete',state:'saved'};
  return {main:/connected/.test(text)?'Cloud connected':'Cloud connecting',sub:'Connection status does not confirm a saved backup.',state:'syncing'};
}
