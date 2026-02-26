import type { BookHit } from "../services/openlibrary.js";
import type { Offer } from "../services/googlebooks.js";

export type ItemResult = {
  book: BookHit;
  offers: Offer[];
  bestPriceCad: number | null;
};

function normIsbn(x: string) {
  return x.replace(/[^0-9X]/gi, "").toUpperCase();
}

export function joinOffersToBooks(books: BookHit[], offers: Offer[]): ItemResult[] {
  const byIsbn = new Map<string, Offer[]>();

  for (const off of offers) {
    if (!off.isbn) continue;
    const k = normIsbn(off.isbn);
    const arr = byIsbn.get(k) ?? [];
    arr.push(off);
    byIsbn.set(k, arr);
  }

  return books.map((b) => {
    const keys = [b.isbn13, b.isbn10].filter(Boolean).map((x) => normIsbn(x!));
    const matched: Offer[] = [];

    for (const k of keys) {
      const hits = byIsbn.get(k);
      if (hits) matched.push(...hits);
    }

    // de-dupe by seller+url
    const uniq = new Map<string, Offer>();
    for (const o of matched) uniq.set(`${o.seller}:${o.url}`, o);

    const sorted = [...uniq.values()].sort((a, c) => a.priceCad - c.priceCad);
    const bestPriceCad = sorted.length ? sorted[0].priceCad : null;

    return { book: b, offers: sorted, bestPriceCad };
  });
}
