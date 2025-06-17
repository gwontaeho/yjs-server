const WebSocket = require("ws");
const Y = require("yjs");
const { loadDoc, saveDoc } = require("./storage");

const docs = new Map(); // docName => Y.Doc
const docClients = new Map(); // docName => Set<WebSocket>

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws, req) => {
    const docName = decodeURIComponent(req.url.slice(1)) || "default";

    // 문서 불러오기 및 캐싱
    let doc = docs.get(docName);
    if (!doc) {
      doc = await loadDoc(docName);
      docs.set(docName, doc);
      doc.on("update", () => saveDoc(docName, doc));
    }

    // 문서별 소켓 그룹 초기화
    if (!docClients.has(docName)) {
      docClients.set(docName, new Set());
    }
    docClients.get(docName).add(ws);

    // 초기 상태 전송
    ws.send(Y.encodeStateAsUpdate(doc));

    ws.on("message", (data) => {
      try {
        const update = new Uint8Array(
          data.buffer,
          data.byteOffset,
          data.byteLength
        );
        Y.applyUpdate(doc, update);

        // 동일한 문서를 보고 있는 클라이언트에게만 broadcast
        for (const client of docClients.get(docName)) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(update);
          }
        }
      } catch (e) {
        console.error(`[${docName}] update 실패: ${e.message}`);
      }
    });

    ws.on("close", () => {
      const set = docClients.get(docName);
      if (set) set.delete(ws);
      console.log(`[close] ${docName}`);
    });
  });

  return wss;
}

module.exports = { initWebSocketServer };
