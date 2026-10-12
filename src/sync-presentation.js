export function syncPresentation(s={}){
 if(s.blocked)return {text:'Another tab is using this workspace',kind:'warn',detail:'Close the other Coaching OS tab before saving here. Phone and laptop can still sync independently.'};
 if(s.lastError?.includes('storage'))return {text:s.lastError,kind:'bad',detail:'Keep this page open. Your latest work may not be saved on this device.'};
 if(s.conflicts)return {text:`${s.conflicts} edit conflict${s.conflicts===1?'':'s'} to review`,kind:'warn',detail:'Both versions are retained. Open Cloud / Backups to choose.'};
 if(s.pending)return {text:`${s.pending} change${s.pending===1?'':'s'} saved on this device · ${!s.online?'offline':s.running?'syncing':s.lastError?'retry pending':'waiting to sync'}`,kind:s.lastError?'warn':'saving',detail:'The cloud has not yet acknowledged all changes.'};
 if(s.lastError)return {text:'Cloud connection needs attention',kind:'warn',detail:s.lastError};
 if(s.online===false)return {text:'Offline · no queued changes',kind:'warn',detail:'Other devices cannot receive changes until the connection returns.'};
 if(s.lastSynced)return {text:`Cloud synced · ${new Date(s.lastSynced).toLocaleTimeString('en-GB')}`,kind:'ok',detail:'All queued changes acknowledged. This is not a separate backup.'};
 return {text:s.connected?'Cloud connected · no pending changes':'Connecting · local workspace available',kind:'',detail:'A connection is not a saved backup.'};
}
