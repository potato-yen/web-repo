import React, { useCallback, useEffect, useState } from "react";

/**
 * TaipeiDashboard.jsx
 *
 * A lightweight React component that fetches data from
 * https://citydashboard.taipei/api/v1/dashboard/ and displays it.
 *
 * Usage:
 *   import TaipeiDashboard from "./TaipeiDashboard";
 *   <TaipeiDashboard />
 *
 * Notes:
 * - If the API blocks browser requests via CORS, run this through a small proxy
 *   (e.g., a Next.js API route or a simple Express/Cloudflare Worker) and set
 *   the `apiUrl` prop to that proxy URL.
 */

export default function TaipeiDashboard({
  apiUrl = "http://localhost:4000/api/taipei",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl, { headers: { "Accept": "application/json" } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
      setFetchedAt(new Date());
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Taipei City Dashboard (React)</h1>
        <div className="flex items-center gap-2">
          {fetchedAt && (
            <span className="text-sm text-gray-500">
              Updated: {fetchedAt.toLocaleString()}
            </span>
          )}
          <button
            onClick={fetchData}
            className="rounded-2xl border px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Request failed</p>
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-xs text-red-600">
            If this is a CORS error in the browser, call the API through a
            server-side proxy and point `apiUrl` to that proxy.
          </p>
        </div>
      )}

      {!error && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {loading && (
            <p className="animate-pulse text-gray-500">Fetching data…</p>
          )}

          {!loading && data && (
            <div className="space-y-3">
              {/* Quick overview of top-level keys */}
              <section>
                <h2 className="mb-2 text-lg font-medium">Overview</h2>
                <ul className="flex flex-wrap gap-2 text-sm text-gray-700">
                  {Object.keys(data).slice(0, 12).map((k) => (
                    <li
                      key={k}
                      className="rounded-full border px-3 py-1"
                      title={k}
                    >
                      {k}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Raw JSON pretty print */}
              <section>
                <h2 className="mb-2 text-lg font-medium">Raw JSON</h2>
                <pre className="max-h-[60vh] overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
{JSON.stringify(data, null, 2)}
                </pre>
              </section>
            </div>
          )}

          {!loading && !data && !error && (
            <p className="text-gray-500">No data.</p>
          )}
        </div>
      )}

      <footer className="mt-6 text-xs text-gray-400">
        Built with React hooks. Set a custom `apiUrl` prop to point at a proxy
        if needed.
      </footer>
    </div>
  );
}