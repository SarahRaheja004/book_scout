
import { Router } from "express";
import { z } from "zod";

const router = Router();

const SearchQuery = z
  .object({
    q: z.string().min(2).max(200).optional(),
    isbn: z.string().regex(/^\d{10}(\d{3})?$/).optional()
  })
  .refine((v) => v.q || v.isbn, { message: "Provide q or isbn" });

router.get("/", (req, res) => {
  const parsed = SearchQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parsed.error.flatten()
    });
  }

  const { q, isbn } = parsed.data;
  const query = isbn ? `ISBN:${isbn}` : q!;

  // MVP: mocked offers
  res.json({
    query,
    currency: "CAD",
    results: [
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
    ]
  });
});

export default router;
