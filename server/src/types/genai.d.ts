declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(config: { apiKey?: string });
    models: {
      generateContent(options: {
        model: string;
        contents: any[];
        config?: {
          responseMimeType?: string;
          responseSchema?: any;
          systemInstruction?: string;
        };
      }): Promise<{ text: string }>;
    };
  }
}
