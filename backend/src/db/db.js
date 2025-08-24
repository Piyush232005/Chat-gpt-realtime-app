const mongoose = require('mongoose');


async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DB connected to mongo db");
        
    } catch (error) {
        console.log("Error in DB connection", error);
        
    }
    
}    

module.exports = connectDB;