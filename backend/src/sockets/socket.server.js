const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {

    const io = new Server(httpServer, {})

    // Middleware to authenticate socket connections

    io.use(async (socket, next) => {

        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");// Parse cookies from the handshake headers prevent undefined error

        console.log('Parsed cookies:', cookies);

        // Check for the token in cookies
        if (!cookies.token) {
            return next(new Error('Authentication error no token provided '));
        }
        try {
            // Verify the token
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error invalid token'));
        }
    })


    io.on("connection", (socket) => {

        socket.on("ai-message", async (messagePayload) => {
            /* messagePayload = { chat:chatId,content:message text } */

            // Save user message in database  and generate its vector
            const [message, vectors] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: messagePayload.content,
                    role: "user"
                }),
                aiService.generateVector(messagePayload.content),
            ])

            await createMemory({
                vectors,
                messageId: message._id,
                metadata: {
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    text: messagePayload.content
                }
            })


            // Retrieve relevant memories and chat history

            const [memory, chatHistory] = await Promise.all([

                queryMemory({
                    queryVector: vectors,
                    limit: 3,
                    metadata: {
                        user: socket.user._id
                    }
                }),

                messageModel.find({
                    chat: messagePayload.chat
                }).sort({ createdAt: -1 }).limit(20).lean().then(messages => messages.reverse())
            ])


            // Generate AI response
            // Prepare messages for AI service
            const stm = chatHistory.map(item => {
                return {
                    role: item.role,
                    parts: [{ text: item.content }]
                }
            })

            // Add system prompt at the beginning
            const ltm = [
                {
                    role: "user",
                    parts: [{
                        text: `

                        these are some previous messages from the chat, use them to generate a response

                        ${memory.map(item => item.metadata.text).join("\n")}
                        
                    ` }]
                }
            ]


            const response = await aiService.generateResponse([...ltm, ...stm])


            socket.emit('ai-response', {
                content: response,
                chat: messagePayload.chat
            })

            const [responseMessage, responseVectors] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: response,
                    role: "model"
                }),
                aiService.generateVector(response)
            ])

            await createMemory({
                vectors: responseVectors,
                messageId: responseMessage._id,
                metadata: {
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    text: response
                }
            })

        })

    })
}


module.exports = initSocketServer;