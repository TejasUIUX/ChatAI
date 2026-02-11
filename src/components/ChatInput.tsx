import * as React from 'react';
import { Send, Loader2, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { processFile } from '../services/FileService';
import type { Attachment } from '../types';

interface ChatInputProps {
    onSend: (message: string, attachments: Attachment[]) => void;
    disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const [input, setInput] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const [attachments, setAttachments] = React.useState<Attachment[]>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsProcessing(true);
            const files = Array.from(e.target.files);

            try {
                const newAttachments: Attachment[] = await Promise.all(files.map(async (file) => {
                    const { type, content } = await processFile(file);
                    return {
                        id: crypto.randomUUID(),
                        name: file.name,
                        type,
                        content,
                        mimeType: file.type
                    };
                }));

                setAttachments(prev => [...prev, ...newAttachments]);
            } catch (error) {
                console.error("File processing failed:", error);
                // Optionally show error toast
            } finally {
                setIsProcessing(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!input.trim() && attachments.length === 0) || disabled || isProcessing) return;

        onSend(input, attachments);
        setInput('');
        setAttachments([]);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const canSend = (input.trim().length > 0 || attachments.length > 0) && !disabled && !isProcessing;

    return (
        <div style={{
            flexShrink: 0,
            width: '100%',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-secondary)'
        }}>
            <div style={{
                maxWidth: '768px',
                margin: '0 auto',
                position: 'relative'
            }}>
                {/* Input Container */}
                <div style={{
                    position: 'relative',
                    border: `2px solid ${isFocused ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: isFocused ? '0 0 0 3px rgba(16, 163, 127, 0.1)' : 'var(--shadow-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 'var(--space-3)',
                    transition: 'all var(--transition-base)'
                }}>
                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 'var(--space-2)',
                            marginBottom: 'var(--space-2)'
                        }}>
                            {attachments.map(att => (
                                <div key={att.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-2) var(--space-3)',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--text-xs)',
                                    border: '1px solid var(--border-primary)'
                                }}>
                                    {att.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                    <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {att.name}
                                    </span>
                                    <button
                                        onClick={() => removeAttachment(att.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Send a message..."
                        disabled={disabled}
                        rows={1}
                        aria-label="Message input"
                        style={{
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            paddingRight: 'var(--space-12)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-base)',
                            lineHeight: 'var(--line-normal)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            transition: 'opacity var(--transition-base)',
                            opacity: disabled ? 0.5 : 1
                        }}
                    />

                    {/* Actions Area */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 'var(--space-2)'
                    }}>
                        {/* File Upload Button */}
                        <div style={{ display: 'flex' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                style={{
                                    position: 'absolute',
                                    width: '1px',
                                    height: '1px',
                                    padding: '0',
                                    margin: '-1px',
                                    overflow: 'hidden',
                                    clip: 'rect(0,0,0,0)',
                                    whiteSpace: 'nowrap',
                                    border: '0'
                                }}
                                multiple
                                accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg,.gif,image/*"
                            />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (fileInputRef.current) {
                                        fileInputRef.current.click();
                                    }
                                }}
                                disabled={disabled || isProcessing}
                                type="button"
                                aria-label="Attach files"
                                style={{
                                    padding: 'var(--space-2)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
                                    color: 'var(--text-secondary)',
                                    transition: 'background-color 0.2s',
                                    opacity: disabled || isProcessing ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!disabled && !isProcessing) {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                    }
                                }}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Attach files"
                            >
                                <Paperclip size={20} />
                            </button>
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!canSend}
                            aria-label="Send message"
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all var(--transition-base)',
                                backgroundColor: canSend ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: canSend ? 'white' : 'var(--text-muted)',
                                cursor: canSend ? 'pointer' : 'not-allowed',
                                boxShadow: canSend ? 'var(--shadow-sm)' : 'none',
                                transform: canSend ? 'scale(1)' : 'scale(0.95)',
                                opacity: canSend ? 1 : 0.5
                            }}
                            onMouseEnter={(e) => {
                                if (canSend) {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (canSend) {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                }
                            }}
                        >
                            {disabled || isProcessing ? (
                                <Loader2 size={18} className="spin" />
                            ) : (
                                <Send size={18} strokeWidth={2.5} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Helper Text */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-2)',
                    paddingLeft: 'var(--space-1)',
                    paddingRight: 'var(--space-1)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)'
                }}>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <span style={{ opacity: 0.7 }}>
                            <kbd style={{
                                padding: '2px 4px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: `1px solid var(--border-primary)`,
                                fontSize: 'var(--text-xs)',
                                fontFamily: 'var(--font-mono)'
                            }}>Enter</kbd> to send
                        </span>
                        <span style={{ opacity: 0.7 }}>
                            <kbd style={{
                                padding: '2px 4px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: `1px solid var(--border-primary)`,
                                fontSize: 'var(--text-xs)',
                                fontFamily: 'var(--font-mono)'
                            }}>Shift + Enter</kbd> for new line
                        </span>
                    </div>
                    {input.length > 0 && (
                        <span style={{
                            opacity: 0.6,
                            fontSize: 'var(--text-xs)'
                        }}>
                            {input.length}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
