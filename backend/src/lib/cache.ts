import { LRUCache } from "lru-cache";

export const searchCache = new LRUCache<string, Record<string, any>>({
  max: 500,               // up to 500 cached queries
  ttl: 10 * 60 * 1000     // 10 minutes
});

export function cacheKeyFromSearch(q?: string, isbn?: string) {
  return `search:q=${q ?? ""}&isbn=${isbn ?? ""}`.toLowerCase();
}
