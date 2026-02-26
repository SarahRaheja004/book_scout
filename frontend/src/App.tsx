import { useState } from "react";

type Offer = {
  seller: string;
  condition: string;
  priceCad: number;
  url: string;
  updatedAt: string;
};

type Book = {
  key: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  isbn13: string | null;
  isbn10: string | null;
  firstPublishYear: number | null;
};

type Item = {
  book: Book;
  offers: Offer[];
  bestPriceCad: number | null;
};

type ApiResponse = {
  items: Item[];
};

export default function App() {
  const [q, setQ] = useState("python");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = (await r.json()) as ApiResponse;
    setItems(data.items ?? []);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 42, marginBottom: 20 }}>BookScout</h1>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: 12, borderRadius: 10 }}
        />
        <button
          onClick={search}
          style={{ padding: "12px 18px", borderRadius: 10, cursor: "pointer" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div style={{ marginTop: 30, display: "grid", gap: 16 }}>
        {items.map((item) => (
          <div
            key={item.book.key}
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr",
              gap: 16,
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 14
            }}
          >
            <div>
              {item.book.coverUrl && (
                <img
                  src={item.book.coverUrl}
                  style={{ width: 100, borderRadius: 8 }}
                />
              )}
            </div>

            <div>
              <h2 style={{ margin: 0 }}>{item.book.title}</h2>
              <div style={{ opacity: 0.7 }}>
                {item.book.authors?.join(", ")}
              </div>

              <div style={{ marginTop: 8 }}>
                {item.bestPriceCad === null ? (
                  <b>No offers available</b>
                ) : (
                  <b style={{ fontSize: 18 }}>
                    Best: ${item.bestPriceCad.toFixed(2)} CAD
                  </b>
                )}
              </div>

              {item.offers.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {item.offers.slice(0, 3).map((o) => (
                    <div key={o.url}>
                      {o.seller} • {o.condition} • ${o.priceCad.toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}