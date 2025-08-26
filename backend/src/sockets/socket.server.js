const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const aiService = require("../services/ai.service");
const { Chat } = require("@google/genai");

function initSocketServer(httpServer) {

    const io = new Server(httpServer ,{})

    // Middleware to authenticate socket connections

    io.use(async (socket, next) => {

        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");// Parse cookies from the handshake headers prevent undefined error

        console.log('Parsed cookies:', cookies);

        // Check for the token in cookies
        if(!cookies.token) {
            return next(new Error('Authentication error no token provided '));
        }
        try {
            // Verify the token
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await  userModel.findById(decoded.id);
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error invalid token'));
        }
    })

    io.on('connection', (socket) => {

        socket.on("ai-message", async(messagePayload) => {

            // messagePayload = {content: "Hello, how are you?", chat: "chatId123"} // Example payload structure

            console.log("Received AI message:", messagePayload);

            const response = await aiService.generateResponse(messagePayload.content);

            socket.emit("ai-response", {
                content: response,
                chat: messagePayload.chat
            });
            
        })
    })
}


module.exports = initSocketServer;