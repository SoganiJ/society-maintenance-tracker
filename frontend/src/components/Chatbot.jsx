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

  const handleTagClick = (tag) => {
    setInput(tag);
  };

  if (!user) return null;

  return (
    <div className="chatbot-wrapper" style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 9999 }}>
      {!isOpen && (
        <button 
          className="chatbot-fab" 
          onClick={() => setIsOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-inner">
            {/* Header */}
            <div className="chatbot-header">
              <h3>✦ AI Assistant</h3>
              <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chatbot-msg chatbot-msg-${msg.role}`}>
                  <div className="chatbot-bubble">
                    {msg.content}
                  </div>
                  {msg.summary && (
                    <button 
                      onClick={() => handleRaiseComplaint(msg.summary)}
                      className="chatbot-action-btn"
                      disabled={loading}
                    >
                      🚨 Log Complaint: "{msg.summary}"
                    </button>
                  )}
                </div>
              ))}
              {loading && (
                <div className="chatbot-typing">
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
            <div className="chatbot-input-area">
              <div className="chatbot-textarea-wrap">
                <textarea
                  className="chatbot-textarea"
                  placeholder="Imagine Something...✦˚"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  disabled={loading}
                />
              </div>
              <div className="chatbot-options">
                <div className="chatbot-icon-btns">
                  {/* Attachment icon */}
                  <button type="button" title="Attach file">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8" />
                    </svg>
                  </button>
                  {/* Template icon */}
                  <button type="button" title="Templates">
                    <svg viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0-8h6m-3-3v6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" fill="none" />
                    </svg>
                  </button>
                </div>
                {loading ? (
                  <button type="button" onClick={handleStop} className="chatbot-stop">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                    </svg>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleSend} 
                    className="chatbot-submit" 
                    disabled={!input.trim()}
                  >
                    <span className="chatbot-submit-inner">
                      <svg viewBox="0 0 512 512" fill="currentColor">
                        <path d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="chatbot-tags">
            <span onClick={() => handleTagClick('Report an issue')}>Report Issue</span>
            <span onClick={() => handleTagClick('Check complaint status')}>Status Check</span>
            <span onClick={() => handleTagClick('Help')}>Help</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
