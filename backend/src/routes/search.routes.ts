import { Router } from "express";
import { z } from "zod";
import { searchOpenLibrary } from "../services/openlibrary.js";
import { fetchGoogleBooksOffers } from "../services/googlebooks.js";

const router = Router();

const SearchQuery = z
  .object({
    q: z.string().min(2).max(200).optional(),
    isbn: z.string().regex(/^\d{10}(\d{3})?$/).optional()
  })
  .refine((v) => v.q || v.isbn, { message: "Provide q or isbn" });

router.get("/", async (req, res) => {
  const parsed = SearchQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parsed.error.flatten()
    });
  }

  const { q, isbn } = parsed.data;
  const query = isbn ? `isbn:${isbn}` : q!;

  try {
    const [books, googleOffers] = await Promise.all([
      searchOpenLibrary(query, 10),
      fetchGoogleBooksOffers({ q, isbn, maxItems: 5 })
    ]);

    // Fallback offers so UI always has something
    const fallbackOffers = [
      {
        seller: "Amazon",
        condition: "Used" as const,
        priceCad: 42.99,
        url: "https://example.com/amazon",
        updatedAt: new Date().toISOString()
      },
      {
        seller: "eCampus",
        condition: "Rental" as const,
        priceCad: 31.5,
        url: "https://example.com/ecampus",
        updatedAt: new Date().toISOString()
      }
    ];

    const offers = googleOffers.length ? googleOffers : fallbackOffers;

    return res.json({
      query,
      currency: "CAD",
      books,
      offers,
      sources: {
        metadata: ["openlibrary"],
        pricing: googleOffers.length ? ["googlebooks"] : ["mock"]
      }
    });
  } catch (e) {
    return res.status(502).json({
      error: "Upstream provider failed",
      message: e instanceof Error ? e.message : "Unknown error"
    });
  }
});

export default router;