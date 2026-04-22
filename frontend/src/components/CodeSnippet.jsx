import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const TABS = ['cURL', 'Python', 'JavaScript', 'Response']

function buildSnippets(key = 'vrish_sk_YOUR_KEY') {
  return {
    cURL: `curl https://api.vrish.ai/v1/chat/completions \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "vrish-chat-v1",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`,

    Python: `import requests

response = requests.post(
    "http://localhost:8000/v1/chat/completions",
    headers={
        "Authorization": "Bearer ${key}",
        "Content-Type": "application/json",
    },
    json={
        "model": "vrish-chat-v1",
        "messages": [
            {"role": "user", "content": "Hello!"}
        ],
        "max_tokens": 512,
    }
)
print(response.json()["choices"][0]["message"]["content"])`,

    JavaScript: `const response = await fetch(
  "http://localhost:8000/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer ${key}",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "vrish-chat-v1",
      messages: [{ role: "user", content: "Hello!" }],
    }),
  }
);
const data = await response.json();
console.log(data.choices[0].message.content);`,

    Response: `{
  "id": "req_a1b2c3d4e5f6",
  "object": "chat.completion",
  "created": 1714000000,
  "model": "vrish-chat-v1",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 10,
    "total_tokens": 22
  },
  "vrish": {
    "routed_to": "llama-3.1-8b-instant",
    "requests_remaining_today": "196"
  }
}`,
  }
}

export default function CodeSnippet({ apiKey }) {
  const [activeTab, setActiveTab] = useState('cURL')
  const [copied, setCopied] = useState(false)
  const snippets = buildSnippets(apiKey)
  const code = snippets[activeTab]

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'inherit',
                background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: activeTab === tab ? 'var(--primary-light)' : 'var(--text-muted)',
                border: activeTab === tab ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={copyCode}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', color: 'var(--text-muted)',
            fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <AnimatePresence mode="wait">
            <motion.span key={copied} initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* Code */}
      <AnimatePresence mode="wait">
        <motion.pre
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="code-block"
          style={{ margin: 0, borderRadius: 0, border: 'none', padding: '20px 24px', fontSize: 12.5, lineHeight: 1.75 }}
        >
          {code}
        </motion.pre>
      </AnimatePresence>
    </div>
  )
}
