import { useMemo, useState } from "react";
import "./App.css";

type Offer = {
  seller: string;
  condition: "New" | "Used" | "Rental" | "Ebook";
  priceCad: number;
  url: string;
  updatedAt: string;
};

type BookHit = {
  source: "openlibrary";
  key: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  isbn10: string | null;
  isbn13: string | null;
  firstPublishYear: number | null;
  editionCount: number | null;
};

type ItemResult = {
  book: BookHit;
  offers: Offer[];
  bestPriceCad: number | null;
};

export default function App() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ItemResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    const query = q.trim();
    if (query.length < 2) {
      setError("Type at least 2 characters.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!r.ok) throw new Error(`Request failed (${r.status})`);

      const data = await r.json();
      setItems(data.items ?? []);
    } catch {
      setError("Search failed. Is the backend running on :4000?");
    } finally {
      setLoading(false);
    }
  }

  const hasResults = items.length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>BookScout</h1>
            <p style={styles.subtitle}>
              Search books and compare the cheapest available offers.
            </p>
          </div>
        </header>

        <div style={styles.searchRow}>
          <div style={styles.inputWrap}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search by title, author, or ISBN…"
              style={styles.input}
            />
            <kbd style={styles.kbd}>Enter</kbd>
          </div>

          <button
            onClick={search}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {error && <div style={styles.alert}>{error}</div>}

        {!loading && !error && !hasResults && (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>Try a search</div>
            <div style={styles.emptyText}>
              Examples: <code style={styles.code}>python</code>,{" "}
              <code style={styles.code}>jane austen</code>,{" "}
              <code style={styles.code}>9780596007973</code>
            </div>
          </div>
        )}

        <div style={styles.grid}>
          {items.map((it) => (
            <ResultCard key={it.book.key} item={it} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ item }: { item: ItemResult }) {
  const { book, offers, bestPriceCad } = item;

  const topOffers = useMemo(() => offers.slice(0, 2), [offers]);

  return (
    <div style={styles.card}>
      <div style={styles.cardInner}>
        <div style={styles.cover}>
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              style={styles.coverImg}
              loading="lazy"
            />
          ) : (
            <div style={styles.coverPlaceholder}>No cover</div>
          )}
        </div>

        <div style={styles.cardBody}>
          <div style={styles.bookTitle} title={book.title}>
            {book.title}
          </div>

          <div style={styles.metaLine}>
            <span style={styles.muted}>
              {book.authors?.length ? book.authors.join(", ") : "Unknown author"}
            </span>
            <span style={styles.dot}>•</span>
            <span style={styles.muted}>
              {book.firstPublishYear ?? "—"}
            </span>
            {book.editionCount != null && (
              <>
                <span style={styles.dot}>•</span>
                <span style={styles.muted}>{book.editionCount} editions</span>
              </>
            )}
          </div>

          <div style={styles.priceRow}>
            <div style={styles.bestLabel}>Best</div>
            <div style={styles.bestPrice}>
              {bestPriceCad == null ? "No offers" : `$${bestPriceCad.toFixed(2)} CAD`}
            </div>
          </div>

          {topOffers.length > 0 ? (
            <div style={styles.offers}>
              {topOffers.map((o) => (
                <a
                  key={`${o.seller}:${o.url}`}
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.offerRow}
                >
                  <div style={styles.offerLeft}>
                    <span style={styles.seller}>{o.seller}</span>
                    <span style={styles.smallDot}>•</span>
                    <span style={styles.offerMeta}>{o.condition}</span>
                  </div>
                  <div style={styles.offerRight}>${o.priceCad.toFixed(2)}</div>
                </a>
              ))}
            </div>
          ) : (
            <div style={styles.noOffers}>
              No pricing offers yet for this book.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 800px at 20% 0%, #1f2937 0%, #0b0f17 55%, #070a10 100%)",
    color: "#e5e7eb"
  },
  container: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "36px 20px 60px"
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 18
  },
  title: { fontSize: 46, margin: 0, letterSpacing: -0.8 },
  subtitle: { margin: "8px 0 0", color: "#a7b0c0" },

  searchRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18
  },
  inputWrap: { flex: 1, position: "relative" },
  input: {
    width: "100%",
    padding: "14px 46px 14px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15, 23, 42, 0.6)",
    color: "#e5e7eb",
    outline: "none"
  },
  kbd: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#b6c2d6",
    background: "rgba(255,255,255,0.06)"
  },
  button: {
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    fontWeight: 600
  },

  alert: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fecaca",
    marginBottom: 14
  },

  empty: {
    marginTop: 18,
    padding: "18px 16px",
    borderRadius: 16,
    border: "1px dashed rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.04)"
  },
  emptyTitle: { fontWeight: 700, marginBottom: 6 },
  emptyText: { color: "#a7b0c0" },
  code: {
    padding: "2px 6px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    marginTop: 18
  },

  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)"
  },
  cardInner: { display: "flex", gap: 14, padding: 14 },
  cover: { width: 84, flexShrink: 0 },
  coverImg: {
    width: 84,
    height: 118,
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)"
  },
  coverPlaceholder: {
    width: 84,
    height: 118,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#9aa6bb"
  },

  cardBody: { flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 22, fontWeight: 800, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  metaLine: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  muted: { color: "#a7b0c0", fontSize: 14 },
  dot: { color: "#5b6475" },

  priceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 10
  },
  bestLabel: {
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#c9d4ea"
  },
  bestPrice: { fontSize: 18, fontWeight: 800 },

  offers: { display: "flex", flexDirection: "column", gap: 8 },
  offerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    textDecoration: "none",
    color: "#e5e7eb",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(15, 23, 42, 0.45)"
  },
  offerLeft: { display: "flex", alignItems: "center", gap: 8 },
  seller: { fontWeight: 700 },
  offerMeta: { color: "#a7b0c0", fontSize: 13 },
  smallDot: { color: "#5b6475", fontSize: 12 },
  offerRight: { fontWeight: 800 },

  noOffers: {
    color: "#a7b0c0",
    fontSize: 14,
    padding: "10px 0"
  }
};