export type Offer = {
    seller: string;
    condition: "New" | "Used" | "Rental" | "Ebook";
    priceCad: number;
    url: string;
    updatedAt: string;
  };
  
  type GoogleBookItem = {
    volumeInfo?: {
      title?: string;
      industryIdentifiers?: Array<{
        type?: string;
        identifier?: string;
      }>;
    };
    saleInfo?: {
      saleability?: string;
      buyLink?: string;
      listPrice?: { amount?: number; currencyCode?: string };
      retailPrice?: { amount?: number; currencyCode?: string };
    };
  };
  
  type GoogleBooksResponse = {
    items?: GoogleBookItem[];
  };
  
  function getIsbnFromItem(item: GoogleBookItem): string | null {
    const ids = item.volumeInfo?.industryIdentifiers ?? [];
    const isbn13 = ids.find((x) => x.type === "ISBN_13")?.identifier;
    const isbn10 = ids.find((x) => x.type === "ISBN_10")?.identifier;
    return isbn13 ?? isbn10 ?? null;
  }
  
  async function fxToCad(amount: number, currency: string): Promise<number> {
    if (!currency || currency.toUpperCase() === "CAD") return amount;
  
    const rates: Record<string, number> = {
      USD: 1.35,
      EUR: 1.47,
      GBP: 1.7
    };
  
    const rate = rates[currency.toUpperCase()];
    return rate ? amount * rate : amount;
  }
  
  export async function fetchGoogleBooksOffers(args: {
    q?: string;
    isbn?: string;
    maxItems?: number;
  }): Promise<Offer[]> {
    const { q, isbn, maxItems = 5 } = args;
  
    const query = isbn ? `isbn:${isbn}` : q ?? "";
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
  
      const priceCad = await fxToCad(amount, currency);
  
      offers.push({
        seller: "Google Books",
        condition: "Ebook",
        priceCad: Math.round(priceCad * 100) / 100,
        url: buyLink,
        updatedAt: now
      });
    }
  
    return offers;
  }
  