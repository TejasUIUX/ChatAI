import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Settings, Folder, ChevronDown, ChevronRight, X } from 'lucide-react';
import type { ChatSession, Project } from '../types';

interface SidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    projects: Project[];
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
    onOpenSettings: () => void;
    onCreateProject: (name: string) => void;
    onDeleteProject: (projectId: string) => void;
    className?: string;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    sessions,
    currentSessionId,
    projects,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    onOpenSettings,
    onCreateProject,
    onDeleteProject,
    className,
    onClose
}) => {
    const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            onCreateProject(newProjectName);
            setNewProjectName('');
            setIsCreatingProject(false);
        }
    };

    // Group sessions
    const unorganizedSessions = sessions.filter(s => !s.projectId);
    const projectSessions: { [key: string]: ChatSession[] } = {};
    projects.forEach(p => {
        projectSessions[p.id] = sessions.filter(s => s.projectId === p.id);
    });

    return (
        <aside
            className={className}
            style={{
                width: '260px',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-primary)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'all var(--transition-base)',
                flexShrink: 0
            }}
        >
            {/* Header */}
            <div style={{
                padding: 'var(--space-4)',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
            }}>
                <button
                    onClick={onNewChat}
                    style={{
                        flex: 1,
                        padding: 'var(--space-3)',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)',
                        fontWeight: 500,
                        fontSize: 'var(--text-sm)',
                        transition: 'background-color var(--transition-base)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                >
                    <Plus size={18} />
                    New Chat
                </button>

                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="mobile-close-btn"
                    style={{
                        padding: 'var(--space-2)',
                        color: 'var(--text-secondary)',
                        display: 'none' // Hidden by default, shown in media query
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Project List & Sessions */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-3)'
            }}>
                {/* Unorganized Chats */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                    {unorganizedSessions.map(session => (
                        <div
                            key={session.id}
                            style={{
                                padding: 'var(--space-3)',
                                margin: 'var(--space-1) 0',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                backgroundColor: currentSessionId === session.id ? 'var(--bg-tertiary)' : 'transparent',
                                color: currentSessionId === session.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                transition: 'background-color var(--transition-base)',
                                position: 'relative'
                            }}
                            onClick={() => onSelectSession(session.id)}
                            onMouseEnter={() => setHoveredSessionId(session.id)}
                            onMouseLeave={() => setHoveredSessionId(null)}
                        >
                            <MessageSquare size={16} />
                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: 'var(--text-sm)',
                                flex: 1
                            }}>
                                {session.title}
                            </span>

                            {(hoveredSessionId === session.id || currentSessionId === session.id) && (
                                <button
                                    onClick={(e) => {
                                        if (window.confirm('Are you sure you want to delete this chat?')) {
                                            onDeleteSession(session.id, e);
                                        } else {
                                            e.stopPropagation(); // prevent opening if cancelled
                                        }
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 'var(--space-1)',
                                        color: 'var(--text-muted)',
                                        opacity: 0.7,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    className="delete-btn"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Projects */}
                {projects.map(project => (
                    <div key={project.id} style={{ marginBottom: 'var(--space-2)' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: 'var(--space-2)',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600
                            }}
                            onClick={() => toggleProject(project.id)}
                        >
                            {expandedProjects.has(project.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span style={{ marginLeft: 'var(--space-2)', flex: 1 }}>{project.name}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to delete this folder and move its chats to Unorganized?')) {
                                        onDeleteProject(project.id);
                                    }
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {expandedProjects.has(project.id) && (
                            <div style={{ paddingLeft: 'var(--space-3)' }}>
                                {projectSessions[project.id]?.map(session => (
                                    <div
                                        key={session.id}
                                        style={{
                                            padding: 'var(--space-2)',
                                            margin: 'var(--space-1) 0',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                            backgroundColor: currentSessionId === session.id ? 'var(--bg-tertiary)' : 'transparent',
                                            color: currentSessionId === session.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            fontSize: 'var(--text-sm)'
                                        }}
                                        onClick={() => onSelectSession(session.id)}
                                    >
                                        <MessageSquare size={14} />
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {session.title}
                                        </span>
                                        <button onClick={(e) => {
                                            if (window.confirm('Delete this chat?')) {
                                                onDeleteSession(session.id, e);
                                            } else {
                                                e.stopPropagation();
                                            }
                                        }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={12} color="var(--text-muted)" />
                                        </button>
                                    </div>
                                ))}
                                {(!projectSessions[project.id] || projectSessions[project.id].length === 0) && (
                                    <div style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Empty
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{
                padding: 'var(--space-4)',
                borderTop: '1px solid var(--border-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)'
            }}>
                {isCreatingProject ? (
                    <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input
                            autoFocus
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Folder Name"
                            style={{
                                flex: 1,
                                padding: 'var(--space-1) var(--space-2)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-primary)',
                                fontSize: 'var(--text-xs)'
                            }}
                            onBlur={() => !newProjectName && setIsCreatingProject(false)}
                        />
                        <button type="submit" disabled={!newProjectName} style={{ display: 'none' }}>Save</button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreatingProject(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                            fontSize: 'var(--text-sm)',
                            textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <Folder size={18} />
                        New Folder
                    </button>
                )}

                <button
                    onClick={onOpenSettings}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)',
                        fontSize: 'var(--text-sm)',
                        textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <Settings size={18} />
                    Settings
                </button>
            </div>

            {/* Context Menu for moving could go here, but omitted for brevity in MVP */}
        </aside>
    );
};

export default Sidebar;
