'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface Document {
  id: string;
  filename: string;
  chunks: number;
}

const SUGGESTED_QUESTIONS = [
  "Summarize this document",
  "What are the biggest risks?",
  "How did revenue change?",
  "What are the key financial ratios?",
  "What are the main business segments?",
];

export default function Assistant() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://127.0.0.1:8000/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setDocuments(prev => [...prev, { id: data.document_id, filename: data.filename, chunks: data.chunks }]);
      setSelectedDoc(data.document_id);
      setMessages([{
        role: 'assistant',
        content: `Document **${data.filename}** uploaded successfully. I've processed it into ${data.chunks} chunks and I'm ready to answer questions about it.`,
      }]);
    } catch (e) {
      alert('Failed to upload document. Make sure it is a PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || !selectedDoc) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/documents/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: selectedDoc, question: q }),
      });
      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get answer. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>AI Financial Assistant</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          RAG pipeline · Gemini 1.5 Flash · PDF document analysis
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '12px' }}>Documents</div>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%', padding: '8px', borderRadius: '7px',
                border: '1px dashed var(--border2)', background: 'transparent',
                color: uploading ? 'var(--text3)' : 'var(--blue)', cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '12px', fontWeight: 500,
              }}
            >
              {uploading ? 'Uploading...' : '+ Upload PDF'}
            </button>

            {documents.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoc(doc.id);
                      setMessages([{ role: 'assistant', content: `Switched to **${doc.filename}**. What would you like to know?` }]);
                    }}
                    style={{
                      padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                      background: selectedDoc === doc.id ? 'var(--blue-dim)' : 'var(--surface2)',
                      color: selectedDoc === doc.id ? 'var(--blue)' : 'var(--text2)',
                      border: `1px solid ${selectedDoc === doc.id ? 'rgba(26,95,255,0.3)' : 'transparent'}`,
                    }}
                  >
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{doc.chunks} chunks</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedDoc && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '10px', color: 'var(--text3)' }}>Suggested Questions</div>
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 10px', borderRadius: '6px', marginBottom: '5px',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text2)', fontSize: '11px', cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', marginTop: '60px' }}>
                Upload a PDF document to start asking questions
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.6,
                  background: msg.role === 'user' ? 'var(--blue)' : 'var(--surface2)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text)',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--surface2)', fontSize: '13px', color: 'var(--text3)' }}>
                  Analyzing document...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={selectedDoc ? "Ask a question about the document..." : "Upload a document first"}
              disabled={!selectedDoc || loading}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: '7px',
                border: '1px solid var(--border2)', background: 'var(--surface2)',
                color: 'var(--text)', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!selectedDoc || loading || !input.trim()}
              style={{
                padding: '9px 18px', borderRadius: '7px', border: 'none',
                background: !selectedDoc || loading || !input.trim() ? 'var(--border2)' : 'var(--blue)',
                color: '#fff', fontSize: '13px', fontWeight: 500,
                cursor: !selectedDoc || loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
