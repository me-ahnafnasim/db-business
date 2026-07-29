import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "../../../config/supabase";

const SNAPSHOT_KEY = "nobosole.catalog.snapshot.v1";
const DETAILS_KEY = "nobosole.catalog.details.v1";
const CACHE_SCHEMA_VERSION = 1;
const SNAPSHOT_FRESH_MS = 24 * 60 * 60 * 1000;
const SNAPSHOT_RETAIN_MS = 7 * 24 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 24 * 60 * 60 * 1000;
const DETAIL_LIMIT = 20;

let detailsStatePromise;
let detailsMutation = Promise.resolve();
let snapshotMutation = Promise.resolve();

function normalizeRevision(value) {
  return value === null || value === undefined ? null : String(value);
}

function parse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function getCurrentCatalogRevision() {
  const { data, error } = await supabase
    .from("catalog_revision")
    .select("revision")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return normalizeRevision(data?.revision);
}

export async function readCatalogSnapshot() {
  const stored = parse(await AsyncStorage.getItem(SNAPSHOT_KEY));
  const age = Date.now() - Number(stored?.cachedAt || 0);
  const valid = stored?.schemaVersion === CACHE_SCHEMA_VERSION
    && normalizeRevision(stored.catalogRevision)
    && stored.catalogRaw?.response
    && stored.storefront
    && age >= 0
    && age <= SNAPSHOT_RETAIN_MS;

  if (!valid) {
    if (stored) await AsyncStorage.removeItem(SNAPSHOT_KEY);
    return null;
  }

  return {
    ...stored,
    catalogRevision: normalizeRevision(stored.catalogRevision),
    fresh: age <= SNAPSHOT_FRESH_MS,
  };
}

export async function writeCatalogSnapshot({
  catalogRevision,
  catalogRaw,
  storefront,
}) {
  const revision = normalizeRevision(catalogRevision);
  if (!revision || !catalogRaw?.response || !storefront) return null;

  const snapshot = {
    schemaVersion: CACHE_SCHEMA_VERSION,
    catalogRevision: revision,
    cachedAt: Date.now(),
    catalogRaw,
    storefront,
  };
  snapshotMutation = snapshotMutation
    .catch(() => {})
    .then(() => AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)));
  await snapshotMutation;
  return { ...snapshot, fresh: true };
}

async function loadDetailsState() {
  if (!detailsStatePromise) {
    detailsStatePromise = AsyncStorage.getItem(DETAILS_KEY).then((value) => {
      const stored = parse(value);
      if (stored?.schemaVersion !== CACHE_SCHEMA_VERSION || !Array.isArray(stored.entries)) {
        return { schemaVersion: CACHE_SCHEMA_VERSION, entries: [] };
      }
      const cutoff = Date.now() - DETAIL_TTL_MS;
      return {
        schemaVersion: CACHE_SCHEMA_VERSION,
        entries: stored.entries
          .filter((entry) => (
            entry?.id
            && entry?.data
            && normalizeRevision(entry.catalogRevision)
            && Number(entry.cachedAt) >= cutoff
          ))
          .slice(0, DETAIL_LIMIT),
      };
    });
  }
  return detailsStatePromise;
}

async function persistDetails(state) {
  await AsyncStorage.setItem(DETAILS_KEY, JSON.stringify(state));
}

export async function readProductDetailCache(productId, catalogRevision) {
  const revision = normalizeRevision(catalogRevision);
  if (!revision) return null;

  const state = await loadDetailsState();
  const index = state.entries.findIndex((entry) => (
    String(entry.id) === String(productId)
    && normalizeRevision(entry.catalogRevision) === revision
    && Date.now() - Number(entry.cachedAt) <= DETAIL_TTL_MS
  ));
  if (index < 0) return null;

  const [entry] = state.entries.splice(index, 1);
  entry.lastAccessedAt = Date.now();
  state.entries.unshift(entry);
  return entry.data;
}

export function writeProductDetailCache(productId, catalogRevision, data) {
  const revision = normalizeRevision(catalogRevision);
  if (!revision || !data) return Promise.resolve();

  detailsMutation = detailsMutation.catch(() => {}).then(async () => {
    const state = await loadDetailsState();
    const id = String(productId);
    state.entries = state.entries.filter((entry) => String(entry.id) !== id);
    state.entries.unshift({
      id,
      catalogRevision: revision,
      cachedAt: Date.now(),
      lastAccessedAt: Date.now(),
      data,
    });
    state.entries = state.entries.slice(0, DETAIL_LIMIT);
    await persistDetails(state);
  });
  return detailsMutation;
}

export async function clearCatalogDataCache() {
  const emptyState = {
    schemaVersion: CACHE_SCHEMA_VERSION,
    entries: [],
  };
  const pendingWrites = detailsMutation.catch(() => {});
  const pendingSnapshotWrites = snapshotMutation.catch(() => {});
  detailsMutation = pendingWrites.then(async () => {
    detailsStatePromise = Promise.resolve(emptyState);
    await AsyncStorage.removeItem(DETAILS_KEY);
  });
  snapshotMutation = pendingSnapshotWrites.then(() => AsyncStorage.removeItem(SNAPSHOT_KEY));
  await Promise.all([detailsMutation, snapshotMutation]);
}

export const catalogCachePolicy = Object.freeze({
  snapshotFreshMs: SNAPSHOT_FRESH_MS,
  snapshotRetainMs: SNAPSHOT_RETAIN_MS,
  detailTtlMs: DETAIL_TTL_MS,
  detailLimit: DETAIL_LIMIT,
});
