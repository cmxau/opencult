import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/features/users/UserContext';
import { useSettings } from '@/features/settings/SettingsContext';
import { getMeasurementsForUser } from '@/features/history/historyService';
import {
  listThreads, getMessages, createThread, deleteThread,
  appendMessage, setThreadTitle, sendChat,
} from '@/features/ai/chatService';
import { GlassCard } from '@/shared/ui/GlassCard';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { SparkleIcon, PlusIcon, ChevronRightIcon } from '@/shared/ui/Icons';
import type { ChatMessage, ChatThread, Measurement } from '@/shared/db/types';

const SUGGESTED_PROMPTS = [
  'Why did my body fat change this week?',
  'Am I gaining muscle?',
  'Explain my visceral fat score in plain English.',
  'What should I do to reach 15% body fat?',
  'Compare my last 30 days.',
  'How is my hydration?',
];

export default function ChatPage() {
  const navigate                     = useNavigate();
  const { activeUser }               = useUsers();
  const { settings }                 = useSettings();
  const [threads, setThreads]        = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages]      = useState<ChatMessage[]>([]);
  const [input, setInput]            = useState('');
  const [sending, setSending]        = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ChatThread | null>(null);
  const scrollRef                    = useRef<HTMLDivElement>(null);

  const hasKey = settings.openAIKey.length > 0;

  /* Load threads + active thread */
  useEffect(() => {
    if (!activeUser?.id) { setThreads([]); setActiveThread(null); setMessages([]); return; }
    listThreads(activeUser.id).then(async (list) => {
      setThreads(list);
      if (list.length === 0) {
        setActiveThread(null);
        setMessages([]);
      } else {
        const first = list[0];
        setActiveThread(first);
        setMessages(await getMessages(first.id!));
      }
    });
  }, [activeUser]);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const openThread = useCallback(async (t: ChatThread) => {
    setActiveThread(t);
    setMessages(await getMessages(t.id!));
    setShowHistory(false);
  }, []);

  const ensureThread = useCallback(async (): Promise<ChatThread | null> => {
    if (!activeUser?.id) return null;
    if (activeThread) return activeThread;
    const t = await createThread(activeUser.id);
    setThreads(prev => [t, ...prev]);
    setActiveThread(t);
    return t;
  }, [activeUser, activeThread]);

  async function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || !activeUser || !hasKey || sending) return;

    const thread = await ensureThread();
    if (!thread) return;

    setInput('');
    setSending(true);
    setError(null);

    // optimistic user message
    const userMsg = await appendMessage(thread.id!, 'user', message);
    setMessages(prev => [...prev, userMsg]);

    try {
      const measurements: Measurement[] = await getMeasurementsForUser(activeUser.id!);
      const reply = await sendChat({
        threadId: thread.id!,
        user:     activeUser,
        history:  messages,                     // before user message
        measurements,
        apiKey:   settings.openAIKey,
        model:    settings.openAIModel,
        userMessage: message,
      });
      const assistantMsg = await appendMessage(thread.id!, 'assistant', reply);
      setMessages(prev => [...prev, assistantMsg]);

      // First exchange — derive title
      const wasEmpty = messages.length === 0;
      if (wasEmpty) {
        const title = message.slice(0, 36) + (message.length > 36 ? '…' : '');
        await setThreadTitle(thread.id!, title);
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, title } : t));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  async function newChat() {
    if (!activeUser?.id) return;
    const t = await createThread(activeUser.id);
    setThreads(prev => [t, ...prev]);
    setActiveThread(t);
    setMessages([]);
    setShowHistory(false);
  }

  async function confirmRemoveThread() {
    if (!pendingDelete?.id) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    await deleteThread(id);
    const remaining = threads.filter(t => t.id !== id);
    setThreads(remaining);
    if (activeThread?.id === id) {
      if (remaining.length > 0) await openThread(remaining[0]);
      else { setActiveThread(null); setMessages([]); }
    }
  }

  if (!activeUser) {
    return (
      <div className="px-5 pt-12 pb-32">
        <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Chat</p>
        <h1 className="text-3xl font-bold leading-tight mb-4" style={{ color: 'var(--ink)' }}>AI assistant</h1>
        <GlassCard>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Select a profile in Settings to begin.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-12 pb-36" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Chat</p>
          <h1 className="text-3xl font-bold leading-tight truncate" style={{ color: 'var(--ink)' }}>
            {activeThread?.title ?? 'New chat'}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowHistory(s => !s)}
            aria-label="Chat history"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-strong)', color: 'var(--ink)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h12" />
            </svg>
          </button>
          <button
            onClick={newChat}
            aria-label="Start new chat"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Thread history sheet */}
      {showHistory && (
        <GlassCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>
            Recent conversations
          </p>
          {threads.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>No previous chats.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {threads.map(t => (
                <li key={t.id} className="flex items-center gap-2">
                  <button
                    onClick={() => openThread(t)}
                    className="flex-1 text-left px-3 py-2 rounded-pill flex items-center gap-2"
                    style={{
                      background: t.id === activeThread?.id ? 'var(--surface-strong)' : 'transparent',
                      color: 'var(--ink)',
                    }}
                  >
                    <span className="text-sm font-medium truncate">{t.title}</span>
                    <span className="text-[10px] flex-shrink-0 ml-auto" style={{ color: 'var(--ink-3)' }}>
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    onClick={() => setPendingDelete(t)}
                    aria-label="Delete chat"
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ color: 'var(--status-alert)' }}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      {/* No API key */}
      {!hasKey && (
        <GlassCard className="mb-4">
          <p className="text-sm mb-3" style={{ color: 'var(--ink)' }}>
            Add your OpenAI API key in Settings to chat with the assistant.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="text-sm font-semibold underline flex items-center gap-1"
            style={{ color: 'var(--ink)' }}
          >
            Open settings <ChevronRightIcon className="w-3 h-3" />
          </button>
        </GlassCard>
      )}

      {/* Messages or empty welcome */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto -mx-5 px-5 scrollbar-none"
        style={{ minHeight: 240 }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--surface-strong)', color: 'var(--ink)' }}
            >
              <SparkleIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                Ask anything about your health
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-2)' }}>
                Your scale history is the context.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 w-full mt-4 max-w-md">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  disabled={!hasKey || sending}
                  className="w-full text-left px-4 py-3 rounded-card transition-transform active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: 'var(--surface)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--ink)',
                  }}
                >
                  <p className="text-sm">{p}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {messages.map(m => <MessageBubble key={m.id} message={m} />)}
            {sending && <MessageBubble message={{ id: -1, threadId: 0, role: 'assistant', content: '', createdAt: '' }} typing />}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs mt-2 px-2" role="alert" style={{ color: 'var(--status-alert)' }}>{error}</p>
      )}

      {/* Composer */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-2 py-2 rounded-pill"
        style={{
          bottom:               'calc(env(safe-area-inset-bottom) + 88px)',
          width:                'min(94vw, 520px)',
          background:           'var(--surface-strong)',
          backdropFilter:       'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border:               '1px solid var(--glass-border)',
          boxShadow:            'var(--glass-shadow-lg)',
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={hasKey ? 'Message Open Cult…' : 'Add an API key in Settings'}
          disabled={!hasKey || sending}
          enterKeyHint="send"
          className="flex-1 bg-transparent px-3 py-2 outline-none text-base"
          style={{ color: 'var(--ink)' }}
          aria-label="Type a message"
        />
        <button
          type="submit"
          disabled={!hasKey || sending || input.trim().length === 0}
          aria-label="Send"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete conversation?"
        message={pendingDelete ? `"${pendingDelete.title}" will be permanently deleted. This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Keep"
        destructive
        onConfirm={confirmRemoveThread}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function MessageBubble({ message, typing = false }: { message: ChatMessage; typing?: boolean }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[82%] rounded-card px-4 py-3 ${isUser ? '' : 'glass'}`}
        style={isUser
          ? { background: 'var(--accent)', color: 'var(--accent-on)' }
          : { color: 'var(--ink)' }}
      >
        {typing ? (
          <div className="flex gap-1 items-center h-5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse_dot" style={{ background: 'var(--ink-3)' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse_dot" style={{ background: 'var(--ink-3)', animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse_dot" style={{ background: 'var(--ink-3)', animationDelay: '0.4s' }} />
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-snug">{message.content}</p>
        )}
      </div>
    </div>
  );
}
