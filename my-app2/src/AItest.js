import React, { useEffect, useRef, useState } from 'react';

export default function AItest({
  defaultModel = 'gpt-5',
  starter = '嗨！幫我測試一下台北旅遊的一日行程～',
}) {
  const [model, setModel] = useState(defaultModel);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  // 🌗 監聽主題切換
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';

  // 載入使用者在本機儲存的 API Key
  useEffect(() => {
    const saved = localStorage.getItem('openai_api_key');
    if (saved) setApiKey(saved);
  }, []);

  // 歡迎訊息 + starter
  useEffect(() => {
    setHistory([{ role: 'model', parts: [{ text: '👋 這裡是 OpenAI Chat，小幫手在這！' }] }]);
    if (starter) setInput(starter);
  }, [starter]);

  // 自動滾到底
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, loading]);

  // 轉換成 OpenAI 格式
  function toOpenAIMessages(h) {
    return h.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts.map(p => p.text).join('\n'),
    }));
  }

  async function sendMessage(message) {
    const content = (message ?? input).trim();
    if (!content || loading) return;
    if (!apiKey) {
      setError('請先輸入有效的 OpenAI API Key');
      return;
    }

    setError('');
    setLoading(true);

    const newHistory = [...history, { role: 'user', parts: [{ text: content }] }];
    setHistory(newHistory);
    setInput('');

    try {
      const messages = toOpenAIMessages(newHistory);

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`OpenAI API 錯誤（HTTP ${resp.status}）：${safeShort(errText)}`);
      }

      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content ?? '[No content]';
      setHistory(h => [...h, { role: 'model', parts: [{ text: reply }] }]);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function safeShort(s, n = 300) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function renderMarkdownLike(text) {
    return text.split(/\n/).map((ln, i) => (
      <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {ln}
      </div>
    ));
  }

  // 🧱 動態樣式：根據 isDark 切換色彩
  const styles = {
    wrap: { display: 'grid', placeItems: 'start', padding: 16 },
    card: {
      width: 'min(900px, 100%)',
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#f8fafc' : '#111827',
      border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '90vh',
    },
    header: {
      padding: '10px 12px',
      fontWeight: 700,
      borderBottom: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
      background: isDark ? '#0f172a' : '#f9fafb',
    },
    controls: {
      display: 'grid',
      gap: 12,
      gridTemplateColumns: '1fr 1fr',
      padding: 12,
    },
    label: { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 },
    input: {
      padding: '10px 12px',
      borderRadius: 10,
      border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
      background: isDark ? '#0f172a' : '#fff',
      color: isDark ? '#f8fafc' : '#111827',
    },
    messages: {
      padding: 12,
      display: 'grid',
      gap: 10,
      maxHeight: 420,
      overflow: 'auto',
      flex: 1,
    },
    msg: {
      borderRadius: 12,
      padding: 10,
      border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
    },
    user: {
      background: isDark ? '#334155' : '#eef2ff',
      borderColor: isDark ? '#475569' : '#c7d2fe',
    },
    assistant: {
      background: isDark ? '#1e293b' : '#f1f5f9',
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    msgRole: { fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 },
    msgBody: { fontSize: 14, lineHeight: 1.5, color: isDark ? '#f1f5f9' : '#111827' },
    error: { color: '#b91c1c', padding: '4px 12px' },
    composer: {
      position: 'sticky',
      bottom: 0,
      background: isDark ? '#0f172a' : '#fff',
      padding: 12,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 8,
      borderTop: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
    },
    textInput: {
      padding: '10px 12px',
      borderRadius: 10,
      border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
      background: isDark ? '#0f172a' : '#fff',
      color: isDark ? '#f8fafc' : '#111827',
    },
    sendBtn: {
      padding: '10px 14px',
      borderRadius: 999,
      border: '1px solid #111827',
      background: isDark ? '#f8fafc' : '#111827',
      color: isDark ? '#0f172a' : '#fff',
      fontSize: 14,
      cursor: 'pointer',
    },
    suggestion: {
      padding: '6px 10px',
      borderRadius: 999,
      border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
      background: isDark ? '#1e293b' : '#f9fafb',
      color: isDark ? '#e2e8f0' : '#111827',
      cursor: 'pointer',
      fontSize: 12,
    },
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>OpenAI Chat（前端直連，不經 proxy）</div>

        {/* Controls */}
        <div style={styles.controls}>
          <label style={styles.label}>
            <span>Model</span>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="例如 gpt-5、gpt-4o-mini"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span>OpenAI API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={e => {
                const v = e.target.value;
                setApiKey(v);
                if (rememberKey) localStorage.setItem('openai_api_key', v);
              }}
              placeholder="貼上你的 API Key（只在本機瀏覽器儲存）"
              style={styles.input}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={e => {
                  setRememberKey(e.target.checked);
                  if (!e.target.checked) localStorage.removeItem('openai_api_key');
                  else if (apiKey) localStorage.setItem('openai_api_key', apiKey);
                }}
              />
              <span>記住在本機（localStorage）</span>
            </label>
          </label>
        </div>

        {/* Messages */}
        <div ref={listRef} style={styles.messages}>
          {history.map((m, idx) => (
            <div key={idx} style={{ ...styles.msg, ...(m.role === 'user' ? styles.user : styles.assistant) }}>
              <div style={styles.msgRole}>{m.role === 'user' ? 'You' : 'OpenAI'}</div>
              <div style={styles.msgBody}>{renderMarkdownLike(m.parts.map(p => p.text).join('\n'))}</div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.msg, ...styles.assistant }}>
              <div style={styles.msgRole}>OpenAI</div>
              <div style={styles.msgBody}>思考中…</div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div style={styles.error}>⚠ {error}</div>}

        {/* Composer */}
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={styles.composer}>
          <input
            placeholder="輸入訊息，按 Enter 送出"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={styles.textInput}
          />
          <button type="submit" disabled={loading || !input.trim() || !apiKey} style={styles.sendBtn}>
            送出
          </button>
        </form>

        {/* Quick examples */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {['今天台北有什麼免費展覽？', '幫我把這段英文翻成中文：Hello from Taipei!', '寫一首關於捷運的短詩'].map(q => (
            <button key={q} type="button" style={styles.suggestion} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
