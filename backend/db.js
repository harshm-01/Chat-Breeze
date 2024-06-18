const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectToMongo = async () => {
  try {
    await mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log("Database Connected!");
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log("Error Connecting to mongodb: " + error);
  }
};

module.exports = connectToMongo;
