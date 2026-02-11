import * as React from 'react';
import { X, Save, Settings } from 'lucide-react';
import type { ApiConfig } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: ApiConfig;
    onSave: (newConfig: ApiConfig) => void;
    systemPrompt: string;
    onSystemPromptChange: (prompt: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    config,
    onSave,
    systemPrompt,
    onSystemPromptChange,
}) => {
    const [localConfig, setLocalConfig] = React.useState<ApiConfig>(config);
    const [localSystemPrompt, setLocalSystemPrompt] = React.useState(systemPrompt);

    React.useEffect(() => {
        if (isOpen) {
            setLocalConfig(config);
            setLocalSystemPrompt(systemPrompt);
        }
    }, [isOpen, config, systemPrompt]);

    const handleSave = () => {
        onSave(localConfig);
        onSystemPromptChange(localSystemPrompt);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl)',
                width: '100%',
                maxWidth: '500px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-primary)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
            }}>
                {/* Header */}
                <div style={{
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom: '1px solid var(--border-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                            padding: 'var(--space-2)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)'
                        }}>
                            <Settings size={20} />
                        </div>
                        <h2 style={{
                            fontSize: 'var(--text-lg)',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                        }}>
                            Settings
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: 'var(--space-6)',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-6)'
                }}>
                    {/* Model Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <label style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            color: 'var(--text-secondary)'
                        }}>
                            AI Model
                        </label>
                        <input
                            type="text"
                            value={localConfig.model}
                            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                            placeholder="e.g., google/gemini-pro-vision, openai/gpt-4o"
                            style={{
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-secondary)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-sm)',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
                        />
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            Enter a vision-capable model ID (e.g., <b>google/gemini-2.0-flash-exp:free</b>, <b>openai/gpt-4o</b>) to use image features.
                        </p>
                    </div>

                    {/* API Key */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <label style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            color: 'var(--text-secondary)'
                        }}>
                            OpenRouter API Key (Optional Override)
                        </label>
                        <input
                            type="password"
                            value={localConfig.apiKey}
                            onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                            placeholder="sk-or-..."
                            style={{
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-secondary)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-sm)',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
                        />
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            If left blank, the environment variable limit will be used.
                        </p>
                    </div>

                    {/* System Prompt */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <label style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            color: 'var(--text-secondary)'
                        }}>
                            System Prompt
                        </label>
                        <textarea
                            value={localSystemPrompt}
                            onChange={(e) => setLocalSystemPrompt(e.target.value)}
                            placeholder="You are a helpful assistant..."
                            rows={6}
                            style={{
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-secondary)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-sm)',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                resize: 'vertical',
                                lineHeight: '1.5'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
                        />
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            Define how the AI should behave.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: 'var(--space-4) var(--space-6)',
                    borderTop: '1px solid var(--border-secondary)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'var(--space-3)'
                }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: 'var(--space-2) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-secondary)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: 'var(--space-2) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
