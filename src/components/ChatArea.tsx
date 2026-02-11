import * as React from 'react';
import { User, Bot, Copy, Check, FileText } from 'lucide-react';
import type { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css'; // You might need to import a style, or we can use a CDN/custom CSS if this fails.
// Since we didn't install highlight.js types or css specifically, we might need to rely on the rehype-highlight default or add a css file.
// Let's assume we need to import a standard style from the CDN in index.html, OR we can try to rely on what's available.
// Actually, rehype-highlight adds classes. We need the CSS.
// For now, let's proceed with the Import. If it fails (which it might if the package doesn't include styles directly in this path), we'll add it to index.html.

interface ChatAreaProps {
    messages: Message[];
    loading: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, loading }) => {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const CopyButton = ({ text }: { text: string }) => {
        const [copied, setCopied] = React.useState(false);

        const handleCopy = async () => {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        };

        return (
            <button
                onClick={handleCopy}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 'var(--space-1)',
                    cursor: 'pointer',
                    color: copied ? 'var(--accent-primary)' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                }}
                title="Copy to clipboard"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
        );
    };

    return (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'var(--bg-primary)',
            padding: 'var(--space-6) 0'
        }}>
            {messages.length === 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '80%',
                    color: 'var(--text-secondary)',
                    gap: 'var(--space-4)',
                    animation: 'fadeIn var(--transition-slow) ease-out',
                    padding: '0 var(--space-4)'
                }}>
                    <div className="empty-state-icon" style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-xl)',
                        backgroundColor: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <Bot size={32} color="var(--accent-primary)" strokeWidth={2} />
                    </div>
                    <h2 className="empty-state-title" style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--space-2)',
                        textAlign: 'center'
                    }}>
                        How can I help you today?
                    </h2>
                    <p className="empty-state-subtitle" style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-muted)',
                        maxWidth: '400px',
                        textAlign: 'center',
                        lineHeight: 'var(--line-relaxed)'
                    }}>
                        Start a conversation by typing a message below
                    </p>
                </div>
            ) : (
                <>
                    {messages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        const isSystem = msg.role === 'system';

                        if (isSystem) return null; // Don't show system messages

                        return (
                            <div
                                key={index}
                                className="message-row"
                                style={{
                                    width: '100%',
                                    padding: 'var(--space-6) var(--space-4)',
                                    backgroundColor: isUser ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                    borderBottom: `1px solid var(--border-secondary)`,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    animation: `slideInFromBottom ${200 + index * 50}ms ease-out`
                                }}
                            >
                                <div className="message-content-wrapper" style={{
                                    width: '100%',
                                    maxWidth: '768px',
                                    display: 'flex',
                                    gap: 'var(--space-4)'
                                }}>
                                    {/* Avatar */}
                                    <div className="message-avatar" style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: isUser ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0,
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'transform var(--transition-base)'
                                    }}>
                                        {isUser ? (
                                            <User size={20} strokeWidth={2} />
                                        ) : (
                                            <Bot size={20} strokeWidth={2} />
                                        )}
                                    </div>

                                    {/* Message Content */}
                                    <div style={{
                                        flex: 1,
                                        lineHeight: 'var(--line-relaxed)',
                                        fontSize: 'var(--text-base)',
                                        color: 'var(--text-primary)',
                                        // whiteSpace: 'pre-wrap', // Markdown handles this
                                        // wordBreak: 'break-word',
                                        minWidth: 0 // Allow shrinking for code blocks
                                    }}>
                                        {/* Role Label & Actions */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 'var(--space-2)',
                                        }}>
                                            <div style={{
                                                fontSize: 'var(--text-xs)',
                                                fontWeight: 700,
                                                color: isUser ? 'var(--text-secondary)' : 'var(--accent-primary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {isUser ? 'You' : 'Grok'}
                                            </div>
                                            <CopyButton text={msg.content} />
                                        </div>


                                        {/* Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div style={{
                                                marginBottom: 'var(--space-3)',
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 'var(--space-2)'
                                            }}>
                                                {msg.attachments.map((att) => (
                                                    <div key={att.id} style={{
                                                        border: '1px solid var(--border-primary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        overflow: 'hidden',
                                                        maxWidth: att.type === 'image' ? '300px' : 'auto'
                                                    }}>
                                                        {att.type === 'image' ? (
                                                            <img
                                                                src={att.content}
                                                                alt={att.name}
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    height: 'auto',
                                                                    display: 'block'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                padding: 'var(--space-2) var(--space-3)',
                                                                backgroundColor: 'var(--bg-tertiary)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 'var(--space-2)',
                                                                fontSize: 'var(--text-sm)'
                                                            }}>
                                                                <FileText size={16} />
                                                                <span>{att.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Message Text (Markdown) */}
                                        <div className="markdown-content" style={{
                                            color: 'var(--text-primary)'
                                        }}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeHighlight]}
                                                components={{
                                                    code({ node, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        const isInline = !match && !className?.includes('language-');
                                                        return !isInline ? (
                                                            <div style={{ position: 'relative', marginTop: '1rem', marginBottom: '1rem' }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '0.5rem 1rem',
                                                                    backgroundColor: '#2d2d2d',
                                                                    borderTopLeftRadius: '6px',
                                                                    borderTopRightRadius: '6px',
                                                                    color: '#e0e0e0',
                                                                    fontSize: '0.8rem',
                                                                    borderBottom: '1px solid #404040'
                                                                }}>
                                                                    <span>{match?.[1] || 'Code'}</span>
                                                                    <CopyButton text={String(children).replace(/\n$/, '')} />
                                                                </div>
                                                                <code className={className}
                                                                    style={{
                                                                        display: 'block',
                                                                        padding: '1rem',
                                                                        overflowX: 'auto',
                                                                        backgroundColor: '#1e1e1e',
                                                                        color: '#e0e0e0',
                                                                        borderBottomLeftRadius: '6px',
                                                                        borderBottomRightRadius: '6px',
                                                                        fontFamily: 'monospace'
                                                                    }}
                                                                    {...props}>
                                                                    {children}
                                                                </code>
                                                            </div>
                                                        ) : (
                                                            <code className={className} style={{
                                                                backgroundColor: 'var(--bg-tertiary)',
                                                                padding: '0.2em 0.4em',
                                                                borderRadius: '4px',
                                                                fontSize: '0.9em',
                                                                fontFamily: 'monospace'
                                                            }} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            {/* Loading Indicator - only show if last message is not an assistant (to avoid duplicate display) */}
            {loading && !(messages.length > 0 && messages[messages.length - 1].role === 'assistant') && (
                <div style={{
                    width: '100%',
                    padding: 'var(--space-6) var(--space-4)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: `1px solid var(--border-secondary)`,
                    display: 'flex',
                    justifyContent: 'center',
                    animation: 'slideInFromBottom var(--transition-base) ease-out'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '768px',
                        display: 'flex',
                        gap: 'var(--space-4)'
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: 'var(--shadow-sm)',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}>
                            <Bot size={20} strokeWidth={2} />
                        </div>

                        {/* Typing Indicator */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            paddingTop: 'var(--space-2)'
                        }}>
                            <div style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: 700,
                                color: 'var(--accent-primary)',
                                marginBottom: 'var(--space-2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginRight: 'var(--space-3)'
                            }}>
                                Grok
                            </div>
                            <span className="dot-typing"></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatArea;
