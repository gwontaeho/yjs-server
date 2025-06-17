const express = require("express");
const http = require("http");
const cors = require("cors");

const apiRoutes = require("./src/api");
const { initWebSocketServer } = require("./src/ws");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use("/api", apiRoutes);

initWebSocketServer(server);

server.listen(3000, () => {
  console.log("run: 3000");
});
