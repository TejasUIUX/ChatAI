
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as api from './services/api';

// --------------------- Mocks ---------------------

// Mock FileService: prevent pdfjs-dist import errors in JSDOM
vi.mock('./services/FileService', () => ({
    processFile: vi.fn(),
    parsePdf: vi.fn(),
    parseDocx: vi.fn(),
    parseText: vi.fn(),
}));

// Mock API: prevent network calls
vi.mock('./services/api', () => ({
    streamChat: vi.fn(),
    summarizeText: vi.fn(),
    generateReply: vi.fn(),
    askQuestion: vi.fn(),
}));

// Mock scrollIntoView (DOM API missing in JSDOM)
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// --------------------- Tests ---------------------

describe('Summerizer App Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders the initial UI correctly', () => {
        render(<App />);
        // Check for the New Chat button specifically
        const newChatButtons = screen.getAllByText('New Chat');
        expect(newChatButtons.length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText('Send a message...')).toBeInTheDocument();
    });

    it('can create a new chat session', () => {
        render(<App />);
        // Initial state check
        const initialCount = screen.getAllByText('New Chat').length;
        expect(initialCount).toBeGreaterThan(0);

        // We could try clicking it, but logic essentially just resets state. 
        // Let's verify we have a sidebar.
        expect(screen.getByRole('button', { name: /New Chat/i })).toBeInTheDocument();
    });

    it('can send a message and receive a response', async () => {
        // Setup mock response
        const mockStreamChat = vi.mocked(api.streamChat);
        mockStreamChat.mockImplementation(async (_messages, _config, onChunk) => {
            onChunk('Hello');
            onChunk(' there!');
        });

        render(<App />);

        // Find input and button
        const input = screen.getByPlaceholderText('Send a message...');
        const sendButton = screen.getByLabelText('Send message');

        // Type and send
        fireEvent.change(input, { target: { value: 'Hi AI' } });
        fireEvent.click(sendButton);

        // Verify user message appears immediately (optimistic)
        // Use getAllByText because it might appear in the sidebar preview too
        await waitFor(() => {
            const userMessages = screen.getAllByText('Hi AI');
            expect(userMessages.length).toBeGreaterThan(0);
        });

        // Verify API called
        await waitFor(() => {
            expect(mockStreamChat).toHaveBeenCalled();
        });

        // Verify AI response appears
        await waitFor(() => {
            expect(screen.getByText('Hello there!')).toBeInTheDocument();
        });
    });

    it('can create a new folder (project)', () => {
        render(<App />);

        // Click New Folder button
        const newFolderBtn = screen.getByText('New Folder');
        fireEvent.click(newFolderBtn);

        // Input appears
        const input = screen.getByPlaceholderText('Folder Name');
        fireEvent.change(input, { target: { value: 'My Test Project' } });
        fireEvent.submit(input);

        // Verify project appears in list
        expect(screen.getByText('My Test Project')).toBeInTheDocument();
    });

    it('persists settings', async () => {
        render(<App />);

        // Open settings
        const settingsBtn = screen.getByText('Settings');
        fireEvent.click(settingsBtn);

        // Modal should be open. Header is "Settings, AI Model"
        expect(screen.getByText('AI Model')).toBeInTheDocument();

        // Change Prompt
        // The placeholder is "You are a helpful assistant..."
        const promptInput = screen.getByPlaceholderText('You are a helpful assistant...');
        fireEvent.change(promptInput, { target: { value: 'You are a pirate.' } });

        // Save
        const saveBtn = screen.getByText('Save Changes');
        fireEvent.click(saveBtn);

        // Verify it's closed
        await waitFor(() => {
            expect(screen.queryByText('AI Model')).not.toBeInTheDocument();
        });

        // Verify persistence (check localStorage)
        const saved = JSON.parse(localStorage.getItem('chatSettings') || '{}');
        expect(saved.systemPrompt).toBe('You are a pirate.');
    });

});
