import React, { useEffect, useMemo, useRef, useState } from 'react';

export type Part = { text: string };
export type ChatMsg = { role: 'user' | 'model'; parts: Part[] };

type Props = {
  /** Default OpenAI model id */
  defaultModel?: string; // e.g. 'gpt-5'
  /** Optional starter message */
  starter?: string;
};

export default function AItest({
  defaultModel = 'gpt-5',
  starter = '嗨！幫我測試一下台北旅遊的一日行程～',
}: Props) {
  const [model, setModel] = useState<string>(defaultModel);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  // 載入使用者在本機儲存的 OpenAI API Key（Demo only）
  useEffect(() => {
    const saved = localStorage.getItem('openai_api_key');
    if (saved) setApiKey(saved);
  }, []);

  // 歡迎訊息 + 預填 starter（維持你原本行為）
  useEffect(() => {
    setHistory([{ role: 'model', parts: [{ text: '👋 這裡是 OpenAI Chat，小幫手在這！' }] }]);
    if (starter) setInput(starter);
  }, [starter]);

  // 自動滾到底
  useEffect(() => {
    const el = listRef.current; if (!el) return; el.scrollTop = el.scrollHeight;
  }, [history, loading]);

  // 轉換：把你原本的 history 轉成 OpenAI 的 messages
  // - Gemini 的 'model' 角色對應到 OpenAI 的 'assistant'
  // - parts: [{text}] 合併為單一 content 字串
  function toOpenAIMessages(h: ChatMsg[]) {
    return h.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts.map(p => p.text).join('\n'),
    }));
  }

  // 呼叫 OpenAI /v1/chat/completions（非串流）
  async function sendMessage(message?: string) {
    const content = (message ?? input).trim();
    if (!content || loading) return;
    if (!apiKey) { setError('請先輸入有效的 OpenAI API Key'); return; }

    setError('');
    setLoading(true);

    // 手動設定context window
    const newHistory: ChatMsg[] = [...history, { role: 'user', parts: [{ text: content }] }];
    setHistory(newHistory);
    setInput('');

    try {
      const messages = toOpenAIMessages(newHistory);

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
      const reply: string =
        data?.choices?.[0]?.message?.content ??
        '[No content]';

      setHistory(h => [...h, { role: 'model', parts: [{ text: reply }] }]);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function safeShort(s: string, n = 300) {
    try {
      if (!s) return '';
      return s.length > n ? s.slice(0, n) + '…' : s;
    } catch { return ''; }
  }

  function renderMarkdownLike(text: string) {
    const lines = text.split(/\n/);
    return (
      <>
        {lines.map((ln, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ln}</div>
        ))}
      </>
    );
  }

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
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              模型名稱請填有效 ID。若錯誤，請改成官方清單中的有效模型。
            </div>
          </label>

          <label style={styles.label}>
            <span>OpenAI API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                const v = e.target.value; setApiKey(v);
                if (rememberKey) localStorage.setItem('openai_api_key', v);
              }}
              placeholder="貼上你的 API Key（只在本機瀏覽器儲存）"
              style={styles.input}
            />
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, fontSize:12 }}>
              <input type="checkbox" checked={rememberKey} onChange={(e)=>{
                setRememberKey(e.target.checked);
                if (!e.target.checked) localStorage.removeItem('openai_api_key');
                else if (apiKey) localStorage.setItem('openai_api_key', apiKey);
              }} />
              <span>記住在本機（localStorage）</span>
            </label>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Demo 用法：在瀏覽器內保存 Key 僅供教學。正式環境請改走後端或使用安全限制的 Key。
            </div>
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
        {error && (
          <div style={styles.error}>⚠ {error}</div>
        )}

        {/* Composer */}
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
          style={styles.composer}
        >
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
          {['今天台北有什麼免費展覽？', '幫我把這段英文翻成中文：Hello from Taipei!', '寫一首關於捷運的短詩'].map((q) => (
            <button key={q} type="button" style={styles.suggestion} onClick={() => sendMessage(q)}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: 'grid', placeItems: 'start', padding: 16 },
  card: {
    width: 'min(900px, 100%)',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '90vh',
  },
  header: {
    padding: '10px 12px',
    fontWeight: 700,
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  controls: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: '1fr 1fr',
    padding: 12,
  },
  // 讓輸入框永遠在網頁底下
  composer: {
  position: 'sticky',
  bottom: 0,
  background: '#fff',
  padding: 12,
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 8,
  borderTop: '1px solid #e5e7eb',
},
  label: { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 },
  input: { padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14 },
  messages: { padding: 12, display: 'grid', gap: 10, maxHeight: 420, overflow: 'auto', flex: 1, overflowY: 'auto', },
  msg: { borderRadius: 12, padding: 10, border: '1px solid #e5e7eb' },
  user: { background: '#eef2ff', borderColor: '#c7d2fe' },
  assistant: { background: '#f1f5f9', borderColor: '#e2e8f0' },
  msgRole: { fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 },
  msgBody: { fontSize: 14, lineHeight: 1.5 },
  error: { color: '#b91c1c', padding: '4px 12px' },
  textInput: { padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14 },
  sendBtn: { padding: '10px 14px', borderRadius: 999, border: '1px solid #111827', background: '#111827', color: '#fff', fontSize: 14, cursor: 'pointer' },
  suggestion: { padding: '6px 10px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 12 },
};
