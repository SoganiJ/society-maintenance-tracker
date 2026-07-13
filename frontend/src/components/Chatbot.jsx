import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import api from '../services/api';
import WifiLoader from './WifiLoader'; 

const Chatbot = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${user?.name || ''}! I'm your Society AI Assistant. How can I help you today?`, summary: null }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Send the conversation history (excluding the first greeting and any summaries)
      const payload = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', { messages: payload }, {
        signal: abortControllerRef.current.signal
      });
      
      const { reply, summary } = res.data.data;
      setMessages(prev => [...prev, { role: 'assistant', content: reply, summary }]);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log('AI request aborted by user.');
        return;
      }
      console.error(err);
      
      let errorMsg = 'AI Assistant is currently unavailable. Please try again later.';
      if (err.response?.status === 401 || err.response?.data?.message?.includes('API Key')) {
        errorMsg = 'AI Service configuration error: Invalid or missing Groq API Key.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMsg}`, summary: null }]);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleRaiseComplaint = async (summary) => {
    setLoading(true);
    try {
      toast.info('Raising complaint automatically...');
      const formData = new FormData();
      formData.append('title', summary);
      formData.append('description', `Logged automatically via AI Assistant Chat. Issue: ${summary}`);
      formData.append('category', 'Other'); 
      formData.append('priority', 'medium');
      
      const res = await complaintService.create(formData);
      toast.success('Complaint raised successfully!');
      
      setIsOpen(false);
      const complaintId = res.data.complaint._id;
      navigate(`/complaints/${complaintId}`);
      
    } catch (err) {
      console.error('Raise Complaint Error:', err.response?.data || err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to raise complaint.';
      toast.error(`Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="chatbot-wrapper" style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 9999 }}>
      {!isOpen && (
        <button 
          className="btn btn-primary btn-icon" 
          onClick={() => setIsOpen(true)}
          style={{ width: '56px', height: '56px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="card" style={{ width: '350px', height: '500px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          {/* Header */}
          <div className="row" style={{ padding: 'var(--space-3)', background: 'var(--accent)', color: 'white', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>AI Assistant</h3>
            <button className="btn-ghost" onClick={() => setIsOpen(false)} style={{ color: 'white', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Chat Body */}
          <div style={{ flex: 1, padding: 'var(--space-3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--bg)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px',
                  borderBottomRightRadius: msg.role === 'user' ? '2px' : '16px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '16px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '0.9rem'
                }}>
                  {msg.content}
                </div>
                {msg.summary && (
                  <button 
                    onClick={() => handleRaiseComplaint(msg.summary)}
                    className="btn btn-sm"
                    disabled={loading}
                    style={{ 
                      marginTop: '8px', 
                      fontSize: '0.8rem', 
                      width: '100%', 
                      background: '#e53e3e',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🚨 Log Complaint: "{msg.summary}"
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'var(--surface)', borderRadius: '16px', borderBottomLeftRadius: '2px' }}>
                <div className="ai-loader">
                  <div className="ai-loader-dot"></div>
                  <div className="ai-loader-dot"></div>
                  <div className="ai-loader-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ padding: 'var(--space-2)', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
            <div className="row gap-2">
              <input 
                type="text" 
                className="input" 
                style={{ flex: 1, borderRadius: '24px', padding: '10px 16px' }} 
                placeholder="Type your issue..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              
              {loading ? (
                <button type="button" onClick={handleStop} className="btn btn-icon" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, backgroundColor: 'var(--status-overdue)', color: 'white' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                  </svg>
                </button>
              ) : (
                <button type="submit" className="btn btn-primary btn-icon" disabled={!input.trim()} style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
