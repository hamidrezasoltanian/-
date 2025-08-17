import { GoogleGenAI } from "@google/genai";
import { Product } from "../types.ts";

// The API key is expected to be populated into process.env by the execution environment.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI | null {
    if (ai) return ai;
    if (API_KEY) {
        ai = new GoogleGenAI({ apiKey: API_KEY });
        return ai;
    }
    return null;
}

export const isAiAvailable = (): boolean => {
    return !!API_KEY;
};

export const generateProductDescription = async (product: Partial<Product>): Promise<string> => {
    const aiInstance = getAiInstance();
    if (!aiInstance) {
        return "سرویس هوش مصنوعی پیکربندی نشده است.";
    }

    const model = 'gemini-2.5-flash';
    const prompt = `برای یک محصول با مشخصات زیر، یک توضیح کوتاه و جذاب تجاری به زبان فارسی بنویس:
نام محصول: ${product.name || 'نامشخص'}
کد محصول: ${product.code || 'نامشخص'}

توضیحات باید مختصر، مفید و مناسب برای یک کاتالوگ یا وب‌سایت واردات باشد.`;

    try {
        const response = await aiInstance.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
            }
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error generating product description with Gemini API:", error);
        return "خطا در تولید توضیحات. لطفاً دوباره تلاش کنید.";
    }
};

export const analyzeReportData = async (reportData: any): Promise<string> => {
    const aiInstance = getAiInstance();
    if (!aiInstance) {
        return "سرویس هوش مصنوعی پیکربندی نشده است.";
    }
    
    const model = 'gemini-2.5-flash';
    const prompt = `
You are an expert business analyst. Analyze the following import and operations report data from a dashboard and provide a concise, insightful summary in Persian.

**Data:**
\`\`\`json
${JSON.stringify(reportData, null, 2)}
\`\`\`

**Instructions:**
Based on the data provided, please provide a report in Persian that includes:
1.  **Overall Summary:** A brief overview of the key metrics (total imports, orders, customers).
2.  **Import Trend Analysis:** Comment on the import trend shown in 'importsOverTime'. Is it increasing, decreasing, or stable? Are there any notable peaks or dips?
3.  **Top Performers:** Mention the top-imported products and top manufacturers.
4.  **Operational Efficiency:** Comment on the 'stepDurations' data. Which steps in the workflow take the longest? What might this indicate?
5.  **Actionable Insights:** Provide 2-3 concrete, actionable recommendations for the business owner to improve imports, efficiency, or customer engagement.

The response should be well-structured, easy to read, and directly address the user's data.
`;

    try {
        const response = await aiInstance.models.generateContent({
            model,
            contents: prompt,
             config: {
                temperature: 0.5,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing report data with Gemini API:", error);
        return "خطا در تحلیل داده‌ها. لطفاً دوباره تلاش کنید.";
    }
};