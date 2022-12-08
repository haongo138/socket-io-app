import http from "http";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { Event, DEFAULT_ROOM } from './constant';
import { createAdapter } from "@socket.io/postgres-adapter";
import { postgresPool } from "./database";
import express from "express";

dotenv.config();
const app = express();
const port = process.env.PORT || 8686;

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.json({ status: "server is now listening your request ! XD" }));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

postgresPool.query(`
  CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id          bigserial UNIQUE,
      created_at  timestamptz DEFAULT NOW(),
      payload     bytea
  );
`);

// configure adapter
wsServer.adapter(createAdapter(postgresPool));

// change default ID generation mechanism
wsServer.engine.generateId = () => {
  return uuidv4();
}

instrument(wsServer, {
  auth: {
    type: "basic",
    username: "admin",
    password: "$2b$10$p8n8h4GoWGJuOQV7ZRlQaOsGqpvZuiRTfOJF8v1os03z4km5svy4S" // "123123a@" encrypted with bcrypt
  },
  namespaceName: "/admin",
});

const adminNamespace = wsServer.of("/admin");
adminNamespace.use((socket, next) => {
  // ensure the user has sufficient rights
  next();
});

adminNamespace.on("connection", (socket) => {
  console.log("An admin've just connected !");
  socket.on("DELETE_USER", () => {
    // ...
  });
});

const clientNamespace = wsServer.of("/client");
clientNamespace.on(Event.CONNECTION, (socket) => {
  const clientAddress = socket.conn.remoteAddress;

  socket.on(Event.JOIN_SERVER, () => {
    socket.join(DEFAULT_ROOM);
    console.log(`Client with ID ${socket.id} joined ${DEFAULT_ROOM} from ${clientAddress} !`);
  });

  socket.on(Event.SEND_MSG, (data) => {
    socket.to(DEFAULT_ROOM).emit(Event.RECEIVE_MSG, data);
  });

  socket.on(Event.DISCONNECT, () => {
    console.log(`Client with ID ${socket.id} has disconnected !`)
  });
});

const handleListen = () => console.log(`Listening on http://localhost:${port}`);

httpServer.listen(port, handleListen);