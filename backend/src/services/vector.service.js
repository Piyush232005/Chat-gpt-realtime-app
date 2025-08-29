// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Use the correct index name from your Pinecone dashboard
const geminiAppIndex = pc.Index('geminiapp');

async function createMemory({ vectors, metadata = {}, messageId }) {
    if (!messageId) {
        messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    if (!Array.isArray(vectors)) {
        throw new Error("vectors must be a flat array of numbers");
    }

    await geminiAppIndex.upsert([
        {
            id: String(messageId),   // must be a string
            values: vectors,         // flat float array
            metadata                 // must be flat key/value pairs
        }
    ]);
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
    if (!Array.isArray(queryVector)) {
        throw new Error("queryVector must be a flat array of numbers");
    }

    const data = await geminiAppIndex.query({
        vector: queryVector,
        topK: limit,
        filter: metadata || undefined, // metadata must be flat
        includeMetadata: true
    });

    return data.matches;
}

module.exports = { createMemory, queryMemory }
