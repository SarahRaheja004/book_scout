export type Offer = {
    seller: string;
    condition: "New" | "Used" | "Rental" | "Ebook";
    priceCad: number;
    url: string;
    updatedAt: string;
    isbn: string; // REQUIRED so joinOffers can match
  };
  
  type GoogleBooksResponse = {
    items?: Array<{
      volumeInfo?: {
        title?: string;
        industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
      };
      saleInfo?: {
        saleability?: string;
        buyLink?: string;
        listPrice?: { amount?: number; currencyCode?: string };
        retailPrice?: { amount?: number; currencyCode?: string };
      };
    }>;
  };
  
  function normIsbn(s: string): string {
    return s.replace(/[^0-9X]/gi, "").toUpperCase();
  }
  
  function getIsbnFromItem(
    item: GoogleBooksResponse["items"] extends Array<infer T> ? T : never
  ): string | null {
    const ids = (item as NonNullable<GoogleBooksResponse["items"]>[number])?.volumeInfo?.industryIdentifiers ?? [];
    const isbn13 = ids.find((x) => x.type === "ISBN_13")?.identifier;
    const isbn10 = ids.find((x) => x.type === "ISBN_10")?.identifier;
    const raw = isbn13 ?? isbn10 ?? null;
    if (!raw) return null;
    const n = normIsbn(raw);
    if (n.length !== 10 && n.length !== 13) return null;
    return n;
  }
  
  async function fxToCad(amount: number, currency: string): Promise<number> {
    if (!currency || currency.toUpperCase() === "CAD") return amount;
  
    const rates: Record<string, number> = {
      USD: 1.35,
      EUR: 1.47,
      GBP: 1.70
    };
    const rate = rates[currency.toUpperCase()];
    return rate ? amount * rate : amount;
  }
  
  export async function fetchGoogleBooksOffers(args: {
    q?: string;
    isbn?: string;
    maxItems?: number;
  }): Promise<Offer[]> {
    const { q, isbn, maxItems = 10 } = args;
  
    const query = isbn ? `isbn:${isbn}` : q ? q : "";
    if (!query) return [];
  
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", String(maxItems));
  
    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`Google Books failed: ${r.status}`);
  
    const data = (await r.json()) as GoogleBooksResponse;
    const now = new Date().toISOString();
  
    const offers: Offer[] = [];
  
    for (const item of data.items ?? []) {
      const sale = item.saleInfo;
      const buyLink = sale?.buyLink;
  
      const priceObj = sale?.retailPrice ?? sale?.listPrice;
      const amount = priceObj?.amount;
      const currency = priceObj?.currencyCode;
  
      if (!buyLink || typeof amount !== "number" || !currency) continue;
  
      // ✅ ISBN is required for joining
      const itemIsbn = getIsbnFromItem(item);
      const fallbackReqIsbn = isbn ? normIsbn(isbn) : null;
      const finalIsbn = itemIsbn ?? fallbackReqIsbn;
  
      if (!finalIsbn) continue;
  
      const priceCad = await fxToCad(amount, currency);
  
      offers.push({
        seller: "Google Books",
        condition: "Ebook",
        priceCad: Math.round(priceCad * 100) / 100,
        url: buyLink,
        updatedAt: now,
        isbn: finalIsbn
      });
    }
  
    return offers;
  }
  