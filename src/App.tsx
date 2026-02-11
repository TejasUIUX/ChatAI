import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import './index.css';
import type { ChatSession, Message, ApiConfig, Attachment, Project } from './types';
import { streamChat } from './services/api';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import ErrorBoundary from './components/ErrorBoundary';
import SettingsModal from './components/SettingsModal';

const DEFAULT_MODEL = "x-ai/grok-4.1-fast";

function App() {
    // State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [apiConfig, setApiConfig] = useState<ApiConfig>({
        apiKey: '',
        model: DEFAULT_MODEL
    });
    const [systemPrompt, setSystemPrompt] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        const savedSessions = localStorage.getItem('chatSessions');
        const savedSettings = localStorage.getItem('chatSettings');
        const savedProjects = localStorage.getItem('chatProjects');

        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                setSessions(parsed);
                if (parsed.length > 0) {
                    setCurrentSessionId(parsed[0].id);
                } else {
                    handleNewChat();
                }
            } catch (e) {
                console.error("Failed to load sessions", e);
                localStorage.removeItem('chatSessions');
                handleNewChat();
            }
        } else {
            handleNewChat();
        }

        if (savedProjects) {
            try {
                setProjects(JSON.parse(savedProjects));
            } catch (e) {
                console.error("Failed to load projects", e);
                localStorage.removeItem('chatProjects');
            }
        }

        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setApiConfig(parsed.config || { apiKey: '', model: DEFAULT_MODEL });
                setSystemPrompt(parsed.systemPrompt || '');
            } catch (e) {
                console.error("Failed to load settings", e);
                localStorage.removeItem('chatSettings');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper to filter sessions for storage (remove image attachments to avoid quota issues)
    const getSessionsForStorage = (sessions: ChatSession[]) => {
        return sessions.map(session => ({
            ...session,
            messages: session.messages.map(msg => ({
                ...msg,
                attachments: msg.attachments?.filter(att => att.type !== 'image')
            }))
        }));
    };

    // Persistence
    useEffect(() => {
        try {
            const sessionsToStore = getSessionsForStorage(sessions);
            localStorage.setItem('chatSessions', JSON.stringify(sessionsToStore));
        } catch (error: any) {
            console.error('Failed to save sessions to localStorage:', error);
            // If quota exceeded, try to save only the current session
            if (error.name === 'QuotaExceededError' && currentSessionId) {
                try {
                    const currentSession = sessions.find(s => s.id === currentSessionId);
                    if (currentSession) {
                        const minimalSessions = getSessionsForStorage([currentSession]);
                        localStorage.setItem('chatSessions', JSON.stringify(minimalSessions));
                    }
                } catch (e) {
                    console.error('Failed to save even minimal session data:', e);
                }
            }
        }
    }, [sessions, currentSessionId]);

    useEffect(() => {
        localStorage.setItem('chatProjects', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        localStorage.setItem('chatSettings', JSON.stringify({
            config: apiConfig,
            systemPrompt
        }));
    }, [apiConfig, systemPrompt]);

    // Helpers
    const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            id: crypto.randomUUID(),
            title: 'New Chat',
            messages: [],
            timestamp: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
    }, []);

    const handleSelectSession = (id: string) => {
        setCurrentSessionId(id);
    };

    const handleDeleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => {
            const updated = prev.filter(s => s.id !== id);
            if (currentSessionId === id) {
                if (updated.length > 0) {
                    setCurrentSessionId(updated[0].id);
                } else {
                    const newSession: ChatSession = {
                        id: crypto.randomUUID(),
                        title: 'New Chat',
                        messages: [],
                        timestamp: Date.now()
                    };
                    setCurrentSessionId(newSession.id);
                    return [newSession];
                }
            }
            return updated;
        });
    };

    // Project Handlers
    const handleCreateProject = (name: string) => {
        const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now()
        };
        setProjects(prev => [...prev, newProject]);
    };

    const handleDeleteProject = (projectId: string) => {
        // Move sessions back to unorganized (or could delete them, but safety first)
        setSessions(prev => prev.map(s => s.projectId === projectId ? { ...s, projectId: undefined } : s));
        setProjects(prev => prev.filter(p => p.id !== projectId));
    };


    const handleSendMessage = async (content: string, attachments: Attachment[]) => {
        if (!currentSessionId) return;

        // Capture session ID to avoid closure issues
        const sessionIdForRequest = currentSessionId;

        const session = getCurrentSession();
        if (!session) return;

        const newUserMsg: Message = { role: 'user', content, attachments };

        // Optimistic update
        const updatedMessages = [...session.messages, newUserMsg];

        setSessions(prev => prev.map(s =>
            s.id === sessionIdForRequest
                ? { ...s, messages: updatedMessages, title: s.messages.length === 0 ? (content.slice(0, 30) || "New Chat") : s.title }
                : s
        ));

        setLoading(true);

        // Placeholder for AI message
        let aiContent = "";

        // Add empty assistant message
        setSessions(prev => prev.map(s =>
            s.id === sessionIdForRequest
                ? { ...s, messages: [...updatedMessages, { role: 'assistant', content: '' }] }
                : s
        ));

        try {
            // Prepend system prompt if it exists
            const messagesToSend = systemPrompt
                ? [{ role: 'system', content: systemPrompt } as Message, ...updatedMessages]
                : updatedMessages;

            let lastUpdate = 0;
            await streamChat(messagesToSend, apiConfig, (chunk) => {
                aiContent += chunk;
                const now = Date.now();
                if (now - lastUpdate > 100) {
                    setSessions(prev => prev.map(s => {
                        if (s.id !== sessionIdForRequest) return s;
                        const msgs = [...s.messages];
                        // Update the last message (which is the assistant's)
                        if (msgs[msgs.length - 1].role === 'assistant') {
                            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: aiContent };
                        }
                        return { ...s, messages: msgs };
                    }));
                    lastUpdate = now;
                }
            });

            // Final update to ensure complete content
            setSessions(prev => prev.map(s => {
                if (s.id !== sessionIdForRequest) return s;
                const msgs = [...s.messages];
                if (msgs[msgs.length - 1].role === 'assistant') {
                    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: aiContent };
                }
                return { ...s, messages: msgs };
            }));

        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "Sorry, I encountered an error. Please try again.";
            const errorMsg: Message = { role: 'assistant', content: `Error: ${errorMessage}` };
            setSessions(prev => prev.map(s => {
                if (s.id !== sessionIdForRequest) return s;
                const msgs = [...s.messages];
                // Update the last message if it's an empty assistant message
                if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant' && msgs[msgs.length - 1].content === '') {
                    msgs[msgs.length - 1] = errorMsg;
                } else {
                    msgs.push(errorMsg);
                }
                return { ...s, messages: msgs };
            }));
        } finally {
            setLoading(false);
        }
    };

    const currentMessages = getCurrentSession()?.messages || [];

    return (
        <div className="app-container" style={{ display: 'flex', height: '100dvh', minHeight: '-webkit-fill-available', overflow: 'hidden' }}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar
                className={isSidebarOpen ? 'sidebar-open' : ''}
                sessions={sessions}
                currentSessionId={currentSessionId}
                projects={projects}
                onSelectSession={(id) => {
                    handleSelectSession(id);
                    setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                onNewChat={() => {
                    handleNewChat();
                    setIsSidebarOpen(false);
                }}
                onDeleteSession={handleDeleteSession}
                onOpenSettings={() => {
                    setIsSettingsOpen(true);
                    setIsSidebarOpen(false);
                }}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main style={{
                flex: 1,
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Mobile Header */}
                <header className="mobile-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="mobile-title">ChatAI</div>
                </header>

                <ErrorBoundary>
                    <ChatArea
                        messages={currentMessages}
                        loading={loading}
                    />

                    <ChatInput
                        onSend={handleSendMessage}
                        disabled={loading}
                    />
                </ErrorBoundary>
            </main>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                config={apiConfig}
                onSave={setApiConfig}
                systemPrompt={systemPrompt}
                onSystemPromptChange={setSystemPrompt}
            />
        </div>
    );
}

export default App;


