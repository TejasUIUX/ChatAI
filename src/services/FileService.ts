import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker src for pdfjs
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    const version = pdfjsLib.version || '3.11.174'; // Fallback version if undefined
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
}

export const parsePdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return text;
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        throw new Error("Failed to parse PDF.");
    }
};

export const parseDocx = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error("DOCX Parsing Error:", error);
        throw new Error("Failed to parse DOCX.");
    }
};

export const parseText = async (file: File): Promise<string> => {
    return await file.text();
};

export const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const processFile = async (file: File): Promise<{ type: 'image' | 'file', content: string }> => {
    if (file.type.startsWith('image/')) {
        const base64 = await convertImageToBase64(file);
        return { type: 'image', content: base64 };
    } else if (file.type === 'application/pdf') {
        const text = await parsePdf(file);
        return { type: 'file', content: text };
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const text = await parseDocx(file);
        return { type: 'file', content: text };
    } else {
        // Fallback to text
        const text = await parseText(file);
        return { type: 'file', content: text };
    }
};
