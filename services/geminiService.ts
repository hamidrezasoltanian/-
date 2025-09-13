import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Product, Order, Workflow, Proforma, ChatMessage } from "../types.ts";

// The API key is expected to be populated into process.env by the execution environment.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI | null {
    // Add a guard to prevent crashes if executed in a non-browser environment (e.g., SSR)
    if (typeof window === 'undefined') {
        return null;
    }
    if (ai) return ai;

    if (API_KEY) {
        try {
            ai = new GoogleGenAI({ apiKey: API_KEY });
            return ai;
        } catch (error) {
            console.error("Error initializing GoogleGenAI:", error);
            return null;
        }
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


export const chatWithAssistant = async (
    message: string,
    context: { orders: Order[], products: Product[], workflows: Workflow[], proformas: Proforma[] }
): Promise<Partial<ChatMessage>> => {
    const aiInstance = getAiInstance();
    if (!aiInstance) {
        return { text: "سرویس هوش مصنوعی پیکربندی نشده است." };
    }

    const model = 'gemini-2.5-flash';
    const systemInstruction = `
You are an intelligent assistant for a business management dashboard called "EZ Dashboard".
Your primary language for responses MUST be Persian.
You have access to the dashboard's current data via a JSON object.
Your goal is to help the user by answering questions about their data and helping them navigate the application.

Available Views: 'home', 'workflow', 'products', 'proforma', 'reports', 'settings', 'activity'.

**Your Capabilities:**
1.  **Data Retrieval:** Answer questions based on the provided JSON data (orders, products, workflows, proformas).
    - Example: "what is the status of order X?", "show me info for product Y".
    - When providing data, be concise.
2.  **Navigation:** If the user asks to go to a specific page, identify the correct view key.
    - Example: "take me to reports" -> navigate to 'reports'.
    - Example: "میخوام کالاها رو ببینم" -> navigate to 'products'.
3.  **General Chit-chat:** You can engage in simple conversation.

**Response Format:**
You MUST respond with a JSON object. Do not output any text outside of the JSON structure.
The JSON object must have a 'response' property, which is another object containing the details.

**JSON Schema:**
{
  "response": {
    "text": "Your textual answer in Persian.",
    "actions": [
      {
        "label": "Button text in Persian (e.g., 'رفتن به صفحه کالاها')",
        "action_type": "navigation",
        "payload": { "view": "<view_key>" }
      }
    ]
  }
}

- **text**: (Required) The text to display to the user.
- **actions**: (Optional) An array of actions. Currently, only 'navigation' is supported.
  - If the user's intent is clearly navigational, include a navigation action.
  - DO NOT invent new action types.

**Data Context:**
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`
`;

    try {
        const response = await aiInstance.models.generateContent({
            model,
            contents: [{
                role: 'user',
                parts: [{ text: message }]
            }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            }
        });
        
        const responseJson = JSON.parse(response.text.trim());
        return {
            text: responseJson.response.text,
            actions: responseJson.response.actions || [],
        };
    } catch (error) {
        console.error("Error chatting with assistant:", error);
        return { text: "متاسفانه در پردازش درخواست شما خطایی رخ داد. لطفاً دوباره تلاش کنید." };
    }
};
