const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const chatController = require('../controllers/chat.controller');


const router = express.Router();

//Post /api/chat/

router.post('/', authMiddleware, chatController.createChat);

module.exports = router;