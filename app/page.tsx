"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AuthModal } from "@/components/AuthModal";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const starters = [
  { label: "Untangle an idea", prompt: "Help me think through an idea I have and turn it into a clear plan." },
  { label: "Write something", prompt: "Help me write a concise, polished piece of copy for a project I am working on." },
  { label: "Learn a concept", prompt: "Explain a difficult concept to me in a simple way, then give me an example." },
];

function SparkIcon() {
  return <span className="spark" aria-hidden="true">✦</span>;
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="m3.2 3.5 13.6 6.2-13.6 6.8 2.3-6.8-2.3-6.2Z" />
      <path d="M5.7 9.7h8.8" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M16.1 8A6.2 6.2 0 0 0 5.2 5.5L3.6 7.1" />
      <path d="M3.6 3.8v3.3h3.3" />
      <path d="M3.9 12A6.2 6.2 0 0 0 14.8 14.5l1.6-1.6" />
      <path d="M16.4 16.2v-3.3h-3.3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ width: 15, height: 15 }}>
      <path d="M7 3h-2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
      <path d="M12 14l4-4-4-4" />
      <path d="M16 10H7" />
    </svg>
  );
}

function UserAvatar({ initial }: { initial: string }) {
  return <span className="user-avatar" aria-hidden="true">{initial}</span>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const endOfMessages = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const userDisplayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";
  const userInitial = (userDisplayName[0] || "G").toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setAccountMenuOpen(false);
  }

  async function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmedInput }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reach Gemini right now.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-mark"><SparkIcon /></div>
          <span className="brand-name">Chat JH</span>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <MenuIcon />
          </button>
        </div>

        <button className="new-chat" onClick={resetConversation}>
          <span>＋</span> New conversation
        </button>

        <div className="history-heading">
          <span>Today</span>
          <span className="history-dot" />
        </div>

        <button className={`history-item ${messages.length ? "active" : ""}`} onClick={resetConversation}>
          <span className="history-icon"><SparkIcon /></span>
          <span className="history-label">A fresh conversation</span>
        </button>

        <div className="sidebar-bottom">
          {user ? (
            <div className="user-menu-wrap">
              {accountMenuOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item danger" onClick={handleSignOut}>
                    <SignOutIcon />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
              <button
                className="account-row-button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                aria-label="Toggle user menu"
              >
                <UserAvatar initial={userInitial} />
                <div className="account-details">
                  <span className="account-name">{userDisplayName}</span>
                  <span className="account-email">{user.email}</span>
                </div>
                <span className="chevron">{accountMenuOpen ? "⌃" : "⌄"}</span>
              </button>
              <p className="plan-label">PERSONAL WORKSPACE</p>
            </div>
          ) : (
            <div className="sidebar-auth-box">
              <button
                className="sidebar-auth-btn"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In / Register
              </button>
              <p className="plan-label">GUEST MODE</p>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <section className="chat-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </button>

          <div className="model-picker">
            <div className="model-symbol"><SparkIcon /></div>
            <span>Chat JH</span>
            <span className="model-version">Gemini</span>
            <span className="chevron">⌄</span>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" onClick={resetConversation} aria-label="Start a new conversation">
              <RefreshIcon />
            </button>

            {user ? (
              <div
                className="top-avatar"
                style={{ cursor: "pointer" }}
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                title={user.email || userDisplayName}
              >
                <UserAvatar initial={userInitial} />
              </div>
            ) : (
              <button
                className="auth-trigger-btn"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="welcome-view">
              <div className="welcome-orb"><SparkIcon /></div>
              <p className="eyebrow">A quiet place to think</p>
              <h1>What&apos;s on your mind?</h1>
              <p className="welcome-copy">
                Ask anything, explore an idea, or make something
                <br className="desktop-break" /> meaningful together.
              </p>
              <div className="starter-grid">
                {starters.map((starter) => (
                  <button
                    className="starter-card"
                    key={starter.label}
                    onClick={() => setInput(starter.prompt)}
                  >
                    <span>{starter.label}</span>
                    <span className="arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, index) => (
                <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}>
                  <div className="message-avatar">
                    {message.role === "user" ? <UserAvatar initial={userInitial} /> : <SparkIcon />}
                  </div>
                  <div className="message-content">
                    <p className="message-author">{message.role === "user" ? userDisplayName : "Chat JH"}</p>
                    <div className="message-text">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-row assistant">
                  <div className="message-avatar"><SparkIcon /></div>
                  <div className="message-content">
                    <p className="message-author">Chat JH</p>
                    <div className="typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endOfMessages} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <p className="error-message">{error}</p>}
          <form className="composer" onSubmit={submitMessage}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              placeholder="Message Chat JH..."
              rows={1}
              aria-label="Message Chat JH"
            />
            <div className="composer-footer">
              <span className="composer-hint">Press Enter to send · Shift + Enter for a new line</span>
              <button
                className="send-button"
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          </form>
          <p className="disclaimer">Chat JH can make mistakes. Check important info.</p>
        </div>
      </section>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
        }}
      />
    </main>
  );
}