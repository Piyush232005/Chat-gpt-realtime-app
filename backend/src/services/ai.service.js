const {GoogleGenAI} = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY  // Ensure your API key is set in environment variables      
});

async function generateResponse(content) {

    const response = await ai.models.generateContent({
        model:"gemini-2.0-flash",
         // Use the appropriate model name
         contents:content
    });
    
    return response.text;
}

module.exports = { generateResponse };