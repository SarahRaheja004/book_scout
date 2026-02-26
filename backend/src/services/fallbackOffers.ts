import type { BookHit } from "./openlibrary.js";
import type { Offer } from "./googlebooks.js";

function pickIsbn(book: BookHit): string | null {
  return book.isbn13 ?? book.isbn10 ?? null;
}

// deterministic-ish price from isbn so it doesn't jump around every refresh
function seedFromIsbn(isbn: string): number {
  let h = 0;
  for (let i = 0; i < isbn.length; i++) h = (h * 31 + isbn.charCodeAt(i)) >>> 0;
  return h;
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}

export function buildFallbackOffers(book: BookHit): Offer[] {
  const isbn = pickIsbn(book);
  if (!isbn) return [];

  const now = new Date().toISOString();
  const seed = seedFromIsbn(isbn);

  // base between ~20 and ~80
  const base = 20 + (seed % 6000) / 100;

  const used = round2(base);
  const rental = round2(Math.max(10, base * 0.72));
  const ebook = round2(Math.max(5, base * 0.55));

  return [
    {
      seller: "Fallback: Amazon (mock)",
      condition: "Used" as "Used",
      priceCad: used,
      url: `https://example.com/amazon?isbn=${encodeURIComponent(isbn)}`,
      updatedAt: now,
      isbn
    },
    {
      seller: "Fallback: eCampus (mock)",
      condition: "Rental" as "Rental",
      priceCad: rental,
      url: `https://example.com/ecampus?isbn=${encodeURIComponent(isbn)}`,
      updatedAt: now,
      isbn
    },
    {
      seller: "Fallback: Google Books (mock)",
      condition: "Ebook" as "Ebook",
      priceCad: ebook,
      url: `https://example.com/googlebooks?isbn=${encodeURIComponent(isbn)}`,
      updatedAt: now,
      isbn
    }
  ].sort((a, b) => a.priceCad - b.priceCad);
}
