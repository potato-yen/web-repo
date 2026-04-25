import React, { useEffect, useRef, useState } from 'react';

export default function AItest({
  defaultModel = 'gpt-5', // 雖然寫 gpt-5，實際 API 呼叫時請確保有權限，或改回 gpt-4o
  starter = '嗨！我想聊聊關於資料科學的職涯規劃...',
}) {
  const [model, setModel] = useState(defaultModel);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  // 載入使用者在本機儲存的 API Key
  useEffect(() => {
    const saved = localStorage.getItem('openai_api_key');
    if (saved) setApiKey(saved);
  }, []);

  // 歡迎訊息 + starter
  useEffect(() => {
    setHistory([{ role: 'model', parts: [{ text: '你好！我是你的 AI 助理。\n有什麼我可以幫你分析或解答的嗎？' }] }]);
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
      <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '4px' }}>
        {ln}
      </div>
    ));
  }

  // ✨ 全新設計：莫蘭迪風格樣式 (Morandi Style)
  const styles = {
    wrap: {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-sans)', // 跟隨主站字體
    },
    card: {
      width: 'min(900px, 100%)',
      height: 'min(700px, 80vh)', // 限制高度，避免過長
      background: 'rgba(255, 255, 255, 0.65)', // 玻璃擬態背景
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      padding: '16px 24px',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      background: 'rgba(255,255,255,0.3)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: 'var(--font-serif)',
      fontSize: '1.1rem',
      fontWeight: 700,
      color: 'var(--col-navy)',
    },
    controls: {
      padding: '12px 24px',
      background: 'rgba(255,255,255,0.2)',
      fontSize: '0.85rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      alignItems: 'center',
      borderBottom: '1px solid rgba(0,0,0,0.03)',
    },
    inputGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
    },
    inputField: {
      padding: '6px 10px',
      borderRadius: '6px',
      border: '1px solid rgba(0,0,0,0.1)',
      background: 'rgba(255,255,255,0.5)',
      color: 'var(--text-main)',
      outline: 'none',
      fontSize: '0.85rem',
      width: '100%',
      transition: 'all 0.2s',
    },
    messages: {
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflowY: 'auto',
      flex: 1,
      scrollBehavior: 'smooth',
    },
    // 氣泡通用樣式
    msg: {
      maxWidth: '85%',
      padding: '14px 18px',
      borderRadius: '12px',
      lineHeight: 1.6,
      fontSize: '0.95rem',
      position: 'relative',
      boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
    },
    // 使用者氣泡：深藏青色 (Navy) + 白字
    user: {
      alignSelf: 'flex-end',
      background: 'var(--col-navy)', 
      color: '#fff',
      borderBottomRightRadius: '2px',
    },
    // AI 氣泡：奶油白 (Cream) + 深灰字
    assistant: {
      alignSelf: 'flex-start',
      background: '#fff', // 或 var(--col-cream)
      color: '#333',
      border: '1px solid rgba(0,0,0,0.05)',
      borderBottomLeftRadius: '2px',
    },
    roleLabel: {
      fontSize: '0.7rem',
      marginBottom: '4px',
      opacity: 0.7,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    composer: {
      padding: '16px 24px',
      background: 'rgba(255,255,255,0.6)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      gap: '12px',
    },
    chatInput: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '30px', // 圓潤輸入框
      border: '1px solid rgba(0,0,0,0.1)',
      background: '#fff',
      outline: 'none',
      fontSize: '0.95rem',
      color: '#333',
      boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
    },
    sendBtn: {
      padding: '10px 24px',
      borderRadius: '30px',
      border: 'none',
      background: 'var(--col-navy)',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'transform 0.2s',
      boxShadow: '0 4px 10px rgba(44, 62, 80, 0.2)',
    },
    error: {
        padding: '8px 24px',
        background: 'rgba(220, 53, 69, 0.1)',
        color: '#b91c1c',
        fontSize: '0.85rem',
        textAlign: 'center',
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        
        {/* Header */}
        <div style={styles.header}>
            <span style={styles.headerTitle}>AI Playground</span>
            <div style={{fontSize: '0.75rem', opacity: 0.6}}>Powered by GPT</div>
        </div>

        {/* Config Panel */}
        <div style={styles.controls}>
            <div style={styles.inputGroup}>
                <span style={{opacity: 0.6}}>API Key:</span>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                        const v = e.target.value;
                        setApiKey(v);
                        if (rememberKey) localStorage.setItem('openai_api_key', v);
                    }}
                    placeholder="sk-..."
                    style={styles.inputField}
                />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', opacity: 0.7 }}>
                <input
                    type="checkbox"
                    checked={rememberKey}
                    onChange={e => {
                        setRememberKey(e.target.checked);
                        if (!e.target.checked) localStorage.removeItem('openai_api_key');
                        else if (apiKey) localStorage.setItem('openai_api_key', apiKey);
                    }}
                />
                <span>Remember Key</span>
            </label>
        </div>

        {/* Chat Area */}
        <div ref={listRef} style={styles.messages}>
          {history.map((m, idx) => (
            <div 
                key={idx} 
                style={{ 
                    ...styles.msg, 
                    ...(m.role === 'user' ? styles.user : styles.assistant) 
                }}
            >
              <div style={styles.roleLabel}>{m.role === 'user' ? 'You' : 'AI Assistant'}</div>
              <div>{renderMarkdownLike(m.parts.map(p => p.text).join('\n'))}</div>
            </div>
          ))}
          {loading && (
            <div style={{...styles.msg, ...styles.assistant, fontStyle: 'italic', opacity: 0.7}}>
              Thinking...
            </div>
          )}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Input Area */}
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={styles.composer}>
          <input
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={styles.chatInput}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()} 
            style={{
                ...styles.sendBtn, 
                opacity: (loading || !input.trim()) ? 0.6 : 1,
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}