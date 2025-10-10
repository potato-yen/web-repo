// app/(tabs)/FormDashboard.tsx
import React, { useMemo, useState } from 'react';

type HttpMethod = 'GET' | 'POST';

type Props = {
  /** 預設 URL；可從父層傳入（例如你表單組好的 previewUrl） */
  defaultUrl?: string;
  /** 可選的預設 method；預設 GET */
  defaultMethod?: HttpMethod;
  /** 提示文字（放課程說明） */
  hint?: string;
};

export default function FormDashboard({
  defaultUrl = 'http://localhost:4000/api/taipei/air/aqi?limit=5',
  defaultMethod = 'GET',
  hint = '輸入 URL、選擇方法，必要時填 Headers/Body 後送出，右側即時顯示結果。'
}: Props) {
  const [url, setUrl] = useState(defaultUrl);
  const [method, setMethod] = useState<HttpMethod>(defaultMethod);
  const [headersText, setHeadersText] = useState<string>('{\n  "Accept": "application/json"\n}');
  const [bodyText, setBodyText] = useState<string>('{\n  "example": "value"\n}');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [responsePreview, setResponsePreview] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const parsedHeaders = useMemo(() => {
    if (!headersText.trim()) return {};
    try {
      const obj = JSON.parse(headersText);
      return obj && typeof obj === 'object' ? obj as Record<string, string> : {};
    } catch {
      return {};
    }
  }, [headersText]);

  async function sendRequest(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setStatus(null);
    setDurationMs(null);
    setResponsePreview('');

    const init: RequestInit = {
      method,
      headers: parsedHeaders,
    };

    if (method === 'POST') {
      try {
        // 若 bodyText 不是 JSON，也允許傳純文字；但預設當 JSON
        const maybeJson = JSON.parse(bodyText);
        init.body = JSON.stringify(maybeJson);
        if (!init.headers) init.headers = {};
        (init.headers as Record<string, string>)['Content-Type'] ??= 'application/json';
      } catch {
        // 非 JSON：直接當純文字 body
        init.body = bodyText;
        if (!init.headers) init.headers = {};
        (init.headers as Record<string, string>)['Content-Type'] ??= 'text/plain';
      }
    }

    const t0 = performance.now();
    try {
      const res = await fetch(url, init);
      const t1 = performance.now();
      setDurationMs(Math.round(t1 - t0));
      setStatus(res.status);

      // 嘗試讀 JSON，若失敗再當文字
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponsePreview(JSON.stringify(json, null, 2));
      } catch {
        setResponsePreview(text);
      }
    } catch (err: any) {
      const t1 = performance.now();
      setDurationMs(Math.round(t1 - t0));
      setErrorMsg(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.left}>
        <h3 style={{ margin: 0 }}>FormDashboard (GET / POST Demo)</h3>
        <p style={{ marginTop: 6, opacity: 0.8, fontSize: 14 }}>{hint}</p>

        <form onSubmit={sendRequest} style={styles.form}>
          <label style={styles.label}>
            <span>URL</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:4000/api/taipei/air/aqi?limit=5"
              style={styles.input}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={styles.label}>
              <span>Method</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                style={styles.input}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </label>

            <label style={styles.label}>
              <span>Quick Tips</span>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                若遇到 CORS，請在本機 Proxy（如 Express）處理並從前端改呼叫 Proxy。
              </div>
            </label>
          </div>

          <label style={styles.label}>
            <span>Headers (JSON)</span>
            <textarea
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              rows={6}
              style={styles.textarea}
            />
          </label>

          {method === 'POST' && (
            <label style={styles.label}>
              <span>Body (JSON 或純文字)</span>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={8}
                style={styles.textarea}
              />
            </label>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending…' : 'Send'}
            </button>

            {status !== null && (
              <span style={pill(status)} title="HTTP Status Code">
                Status: {status}
              </span>
            )}
            {durationMs !== null && (
              <span style={styles.pillMuted} title="Request Duration">
                {durationMs} ms
              </span>
            )}
          </div>
        </form>
      </div>

      <div style={styles.right}>
        <div style={styles.panelHeader}>Response</div>
        <div style={styles.panelBody}>
          {errorMsg ? (
            <pre style={{ ...styles.pre, color: '#b91c1c' }}>{errorMsg}</pre>
          ) : responsePreview ? (
            <pre style={styles.pre}>{responsePreview}</pre>
          ) : (
            <div style={{ opacity: 0.6 }}>尚未有回應，送出請求後顯示結果。</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'start',
  },
  left: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 16,
  },
  form: {
    display: 'grid',
    gap: 12,
    marginTop: 8,
  },
  label: {
    display: 'grid',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    fontSize: 14,
    outline: 'none',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    outline: 'none',
    resize: 'vertical',
  },
  button: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid #111827',
    background: '#111827',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
  right: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '10px 12px',
    fontWeight: 700,
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  panelBody: {
    padding: 12,
    maxHeight: 520,
    overflow: 'auto',
  },
  pre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
    lineHeight: 1.5,
  },
  pillMuted: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    fontSize: 12,
  },
};

function pill(status: number): React.CSSProperties {
  const ok = status >= 200 && status < 300;
  const bg = ok ? '#ecfdf5' : '#fef2f2';
  const border = ok ? '#10b981' : '#ef4444';
  const color = ok ? '#065f46' : '#7f1d1d';

  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    background: bg,
    border: `1px solid ${border}`,
    color,
    fontSize: 12,
    fontWeight: 700,
  };
}