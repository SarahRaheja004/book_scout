import { Router } from "express";
import { z } from "zod";

import { searchOpenLibrary } from "../services/openlibrary.js";
import { fetchGoogleBooksOffers } from "../services/googlebooks.js";
import { joinOffersToBooks } from "../lib/joinOffers.js";

import type { Offer } from "../services/googlebooks.js";
import type { BookHit } from "../services/openlibrary.js";

const router = Router();

const SearchQuery = z
  .object({
    q: z.string().min(2).max(200).optional(),
    isbn: z.string().regex(/^\d{10}(\d{3})?$/).optional()
  })
  .refine((v) => v.q || v.isbn, { message: "Provide q or isbn" });

function hashToPriceCad(seed: string, min = 15, max = 120): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const t = (h >>> 0) / 2 ** 32; // 0..1
  const price = min + t * (max - min);
  return Math.round(price * 100) / 100;
}

function fallbackOffersFromBooks(books: BookHit[], query: string): Offer[] {
  const now = new Date().toISOString();

  const offers: Offer[] = [];
  for (const b of books) {
    const isbn = b.isbn13 ?? b.isbn10;
    if (!isbn) continue;

    const base = `${isbn}:${b.title}:${query}`;

    offers.push(
      {
        seller: "Amazon (mock)",
        condition: "Used",
        priceCad: hashToPriceCad(base + ":amazon-used", 10, 90),
        url: "https://example.com/amazon",
        updatedAt: now,
        isbn
      },
      {
        seller: "eCampus (mock)",
        condition: "Rental",
        priceCad: hashToPriceCad(base + ":ecampus-rental", 8, 70),
        url: "https://example.com/ecampus",
        updatedAt: now,
        isbn
      }
    );
  }
  return offers;
}

router.get("/", async (req, res) => {
  const parsed = SearchQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parsed.error.flatten()
    });
  }

  const { q, isbn } = parsed.data;
  const query = isbn ? `ISBN:${isbn}` : q!;

  try {
    const books = await searchOpenLibrary(query, 10);

    let googleOffers: Offer[] = [];
    try {
      googleOffers = await fetchGoogleBooksOffers({ q, isbn, maxItems: 10 });
    } catch {
      googleOffers = [];
    }

    // ✅ fallback if Google Books gives nothing
    const offers: Offer[] =
      googleOffers.length > 0 ? googleOffers : fallbackOffersFromBooks(books, query);

    const items = joinOffersToBooks(books, offers).sort(
      (a, b) => (a.bestPriceCad ?? Infinity) - (b.bestPriceCad ?? Infinity)
    );

    return res.json({
      query,
      currency: "CAD",
      items,
      sources: {
        metadata: ["openlibrary"],
        pricing: googleOffers.length > 0 ? ["googlebooks"] : ["mock"]
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Search failed" });
  }
});

export default router;
