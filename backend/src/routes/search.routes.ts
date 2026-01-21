import { Router } from "express";
import { z } from "zod";
import { searchOpenLibrary } from "../services/openlibrary.js";

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
    const books = await searchOpenLibrary(query, 10);

    // MVP: still mocked offers (same idea as KickRax, but for books)
    const offers = [
      {
        seller: "Amazon",
        condition: "Used",
        priceCad: 42.99,
        url: "https://example.com/amazon",
        updatedAt: new Date().toISOString()
      },
      {
        seller: "eCampus",
        condition: "Rental",
        priceCad: 31.5,
        url: "https://example.com/ecampus",
        updatedAt: new Date().toISOString()
      }
    ];

    return res.json({
      query,
      currency: "CAD",
      books,
      offers
    });
  } catch (e) {
    return res.status(502).json({
      error: "Upstream provider failed",
      message: e instanceof Error ? e.message : "Unknown error"
    });
  }
});

export default router;