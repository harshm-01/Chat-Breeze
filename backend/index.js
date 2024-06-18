const express = require("express");
const dotenv = require("dotenv");
const connectToMongo = require("./db");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const fs = require("fs");
dotenv.config();
connectToMongo();

const jwtSecret = process.env.JWT_SECRET;
const Salt = bcrypt.genSaltSync(10);

app.use(express.json());

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URI,
  })
);

app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(cookieParser());

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("No Token!!");
    }
  });
}

app.get("/", (req, res) => {
  res.json("test ok");
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, ourId] },
    recipient: { $in: [userId, ourId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get("/people", async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    }
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", '', { sameSite: "none", secure: true }).json("Ok!");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashPassword = bcrypt.hashSync(password, Salt);
  const createdUser = await User.create({
    username: username,
    password: hashPassword,
  });
  jwt.sign(
    { userId: createdUser._id, username },
    jwtSecret,
    {},
    (err, token) => {
      if (err) throw err;
      res
        .cookie("token", token, { sameSite: "none", secure: true })
        .status(201)
        .json({
          id: createdUser._id,
        });
    }
  );
});

const server = app.listen(5000);

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  // read username and id form the cookie for this connection

  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }

    connection.on("message", async (message) => {
      const messageData = JSON.parse(message.toString());
      const { recipient, text, file } = messageData;
      let filename = null;
      if (file && file.info) {
        const parts = file.info.split(".");
        const ext = parts[parts.length - 1];
        filename = Date.now() + "." + ext;
        const path = __dirname + "/uploads/" + filename;
        const BufferData = new Buffer(file.data.split(',')[1], "base64");
        fs.writeFile(path, BufferData, () => {
          console.log("file Saved!" + path);
        });
      }
      if (recipient && (text || file)) {
        const MessageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
          file: filename,
        });
        [...wss.clients]
          .filter((c) => c.userId === recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                text,
                sender: connection.userId,
                recipient,
                file: filename,
                _id: MessageDoc._id,
              })
            )
          );
      }
    });
  }

  // notify everyone about online people (when someone connects)
  notifyAboutOnlinePeople();
});

// hiQQGxZqsUCblS4i
