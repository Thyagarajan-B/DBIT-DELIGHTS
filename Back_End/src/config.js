const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/Login");

connect.then(() => {
    console.log("DB connected successfully");
})
.catch((err) => {
    console.log("DB not connected", err);
});

const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const collection = mongoose.model("users", loginSchema);
module.exports = collection;