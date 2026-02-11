import type { SummaryResult, ApiConfig, Message } from '../types';

export const summarizeText = async (text: string, config: ApiConfig): Promise<SummaryResult> => {
    const systemPrompt = `
  You are an expert summarizer for busy executives. 
  Your task is to analyze the provided text and output a JSON object with exactly the following 4 fields:
  1. "sec10": A very brief 10-second summary (1-2 sentences).
  2. "min1": A 1-minute summary (short paragraph).
  3. "fullBreakdown": A comprehensive breakdown of key points.
  4. "actionPoints": An array of strings, each being an actionable step or takeaway.

  Ensure the output is valid JSON. Do not include markdown code blocks.
  `;

    const apiKey = config.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("API key is required. Please set it in Settings.");
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173", // Optional: Client URL
                "X-Title": "Explain Like I'm Busy" // Optional: App name
            },
            body: JSON.stringify({
                model: config.model || "x-ai/grok-4.1-fast",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from API");
        }

        // Parse JSON
        try {
            const parsed = JSON.parse(content);
            return {
                sec10: parsed.sec10 || "Summary unavailable",
                min1: parsed.min1 || "Summary unavailable",
                fullBreakdown: parsed.fullBreakdown || "Summary unavailable",
                actionPoints: Array.isArray(parsed.actionPoints) ? parsed.actionPoints : []
            };
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, content);
            throw new Error("Failed to parse AI response. The model might not have returned valid JSON.");
        }

    } catch (error) {
        console.error("Summarization failed:", error);
        throw error;
    }
};

export const generateReply = async (summary: string, intent: string, config: ApiConfig): Promise<string> => {
    const systemPrompt = `
    You are an expert executive assistant.
    Based on the provided summary of a document/email and the user's intent, draft a professional, concise response.
    
    Intent: ${intent}
    
    Output ONLY the body of the email/response. No subject line unless requested. Keep it professional and brief.
    `;

    const apiKey = config.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("API key is required. Please set it in Settings.");
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Explain Like I'm Busy"
            },
            body: JSON.stringify({
                model: config.model || "x-ai/grok-4.1-fast",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Context Summary: ${summary}\n\nDraft a response.` }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "Could not generate reply.";
    } catch (error) {
        console.error("Reply generation failed:", error);
        throw error;
    }
};

export const askQuestion = async (context: string, question: string, config: ApiConfig): Promise<string> => {
    const systemPrompt = `
    You are a helpful assistant answering questions about a specific document.
    Use ONLY the provided context to answer the question. If the answer is not in the context, say "I couldn't find that information in the document."
    Keep answers concise and relevant to a busy executive.
    `;

    const apiKey = config.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("API key is required. Please set it in Settings.");
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Explain Like I'm Busy"
            },
            body: JSON.stringify({
                model: config.model || "x-ai/grok-4.1-fast",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Context: ${context}\n\nQuestion: ${question}` }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "Could not generate answer.";
    } catch (error) {
        console.error("Q&A failed:", error);
        throw error;
    }
};

export const streamChat = async (
    messages: Message[],
    config: ApiConfig,
    onChunk: (chunk: string) => void
): Promise<void> => {
    const apiKey = config.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("API key is required. Please set it in Settings.");
    }

    // Convert internal message format to OpenRouter/OpenAI format
    const formattedMessages = messages.map(msg => {
        if (!msg.attachments || msg.attachments.length === 0) {
            return { role: msg.role, content: msg.content };
        }

        // Multi-modal content
        const contentParts: any[] = [];

        // Add text content
        if (msg.content) {
            contentParts.push({ type: "text", text: msg.content });
        }

        // Add attachments
        msg.attachments.forEach(att => {
            if (att.type === 'image') {
                contentParts.push({
                    type: "image_url",
                    image_url: {
                        url: att.content // base64
                    }
                });
            } else {
                // For files, we append their content to the text
                contentParts.push({
                    type: "text",
                    text: `\n\n[Attachment: ${att.name}]\n${att.content}\n`
                });
            }
        });

        return { role: msg.role, content: contentParts };
    });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Summerizer"
            },
            body: JSON.stringify({
                model: config.model || "x-ai/grok-4.1-fast",
                messages: formattedMessages,
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = response.statusText;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorData.message || response.statusText;
            } catch (e) {
                // Ignore json parse error
            }
            throw new Error(`API Error (${response.status}): ${errorMessage}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split("\n");
            // Keep the last part in the buffer as it might be incomplete
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim() === "") continue;
                if (line.trim() === "data: [DONE]") return;

                if (line.startsWith("data: ")) {
                    try {
                        const json = JSON.parse(line.slice(6));
                        const content = json.choices[0]?.delta?.content || "";
                        if (content) {
                            onChunk(content);
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk", e);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Streaming failed:", error);
        throw error;
    }
};

export const sendChat = async (messages: Message[], config: ApiConfig): Promise<string> => {
    // Legacy support or fallback if needed
    // ... (existing code, but ideally we use streaming everywhere now)
    // For now, let's keep it as is or redirect to streamChat if we wanted unified interface, 
    // but the instruction was to ADD streamChat.
    // I will leave sendChat as is for backward compatibility or non-streaming use cases if any.

    // Actually, I'll update it to handle attachments too, just in case.
    const apiKey = config.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

    // Convert internal message format to OpenRouter/OpenAI format
    const formattedMessages = messages.map(msg => {
        if (!msg.attachments || msg.attachments.length === 0) {
            return { role: msg.role, content: msg.content };
        }
        const contentParts: any[] = [];
        if (msg.content) contentParts.push({ type: "text", text: msg.content });
        msg.attachments.forEach(att => {
            if (att.type === 'image') {
                contentParts.push({ type: "image_url", image_url: { url: att.content } });
            } else {
                contentParts.push({ type: "text", text: `\n\n[Attachment: ${att.name}]\n${att.content}\n` });
            }
        });
        return { role: msg.role, content: contentParts };
    });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Summerizer"
            },
            body: JSON.stringify({
                model: config.model || "x-ai/grok-4.1-fast",
                messages: formattedMessages
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
        console.error("Chat completion failed:", error);
        throw error;
    }
};
