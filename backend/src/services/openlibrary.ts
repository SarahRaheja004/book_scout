type OpenLibraryDoc = {
    key?: string;
    title?: string;
    author_name?: string[];
    cover_i?: number;
    isbn?: string[];
    first_publish_year?: number;
    edition_count?: number;
  };
  
  type OpenLibrarySearchResponse = {
    docs: OpenLibraryDoc[];
  };
  
  export type BookHit = {
    source: "openlibrary";
    key: string; // e.g. "/works/OL123W"
    title: string;
    authors: string[];
    coverUrl: string | null;
    isbn10: string | null;
    isbn13: string | null;
    firstPublishYear: number | null;
    editionCount: number | null;
  };
  
  function normalizeIsbn(s: string): string {
    return s.replace(/[^0-9X]/gi, "").toUpperCase();
  }
  
  function pickIsbn(isbns: string[] | undefined, len: 10 | 13): string | null {
    if (!isbns) return null;
    const hit = isbns.find((x) => normalizeIsbn(x).length === len);
    return hit ? normalizeIsbn(hit) : null;
  }
  
  export async function searchOpenLibrary(query: string, limit = 10): Promise<BookHit[]> {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
  
    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`OpenLibrary search failed: ${r.status}`);
  
    const data = (await r.json()) as OpenLibrarySearchResponse;
  
    return (data.docs ?? [])
      .map((d): BookHit => {
        const coverUrl =
          typeof d.cover_i === "number"
            ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
            : null;
  
        const isbn10 = pickIsbn(d.isbn, 10);
        const isbn13 = pickIsbn(d.isbn, 13);
  
        return {
          source: "openlibrary",
          key: d.key ?? "",
          title: d.title ?? "Untitled",
          authors: d.author_name ?? [],
          coverUrl,
          isbn10,
          isbn13,
          firstPublishYear: d.first_publish_year ?? null,
          editionCount: d.edition_count ?? null
        };
      })
      .filter((x) => x.key.length > 0 && x.title.length > 0);
  }
  