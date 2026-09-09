export const CLOUD_SYNC_DELTA_VERSION = 1;

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out,key)=>{
      const next = value[key];
      if (next !== undefined) out[key] = canonical(next);
      return out;
    },{});
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(canonical(value));
}

export function buildCollectionState(items = [], idGetter = item => item?.id, idNormaliser = value => String(value || '')) {
  const state = new Map();
  items.forEach((item,index)=>{
    const id = idNormaliser(idGetter(item,index));
    if (!id) return;
    state.set(id, stableStringify(item));
  });
  return state;
}

export function diffCollection(items = [], idGetter = item => item?.id, previousState = new Map(), idNormaliser = value => String(value || '')) {
  const nextState = new Map();
  const upserts = [];
  const deletes = [];

  items.forEach((item,index)=>{
    const id = idNormaliser(idGetter(item,index));
    if (!id) return;
    const signature = stableStringify(item);
    nextState.set(id,signature);
    if (previousState.get(id) !== signature) upserts.push({ id, item, index });
  });

  for (const id of previousState.keys()) {
    if (!nextState.has(id)) deletes.push(id);
  }

  return { upserts, deletes, nextState, changed:upserts.length + deletes.length };
}

export function hasDataChanged(previousValue, nextValue) {
  return stableStringify(previousValue) !== stableStringify(nextValue);
}
