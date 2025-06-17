const WebSocket = require("ws");
const Y = require("yjs");
const { loadDoc, saveDoc } = require("./storage");

const docs = new Map();

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws, req) => {
    const docName = req.url.slice(1) || "default";

    let doc = docs.get(docName);
    if (!doc) {
      doc = await loadDoc(docName);
      docs.set(docName, doc);
      doc.on("update", () => saveDoc(docName, doc));
    }

    // Initialize
    ws.send(Y.encodeStateAsUpdate(doc));

    ws.on("message", (data) => {
      try {
        const update = new Uint8Array(data);
        Y.applyUpdate(doc, update);

        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(update);
          }
        });
      } catch (e) {
        console.log(`error: ${e.message}`);
      }
    });

    ws.on("close", () => {
      console.log(`closed: ${docName}`);
    });
  });

  return wss;
}

module.exports = { initWebSocketServer };
