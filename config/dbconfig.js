const mongoose = require("mongoose");
const mongo_url = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/thinkdebug";

const connectDB = async () => {
    try {
        await mongoose.connect(mongo_url);
        console.log("MongoDB Database Connected Succesfully");
        console.log(`The connection URL of MongoDb is : ${mongo_url}`);
    } catch (error) {
        console.log("Database Connection Error:", error.message);

        process.exit(1); // failure exit   ==> 0 measn successs exit
    }
};

module.exports = connectDB;