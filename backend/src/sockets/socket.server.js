const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

function initSocketServer(httpServer) {

    const io = new Server(httpServer ,{})

    // Middleware to authenticate socket connections
    
    io.use(async (socket, next) => {

        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

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
        console.log('a user connected', socket.id);
    })
}


module.exports = initSocketServer;