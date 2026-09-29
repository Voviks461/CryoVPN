const WebSocket = require('ws');
const http = require('http');
const net = require('net');

const port = process.env.PORT || 10000;
const uuid = (process.env.UUID || "0653b692a07a934b9ef41b17f1f0f696").replace(/-/g, ''); 

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server Status: Active');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    let isFirstPacket = true;
    let remoteSocket = null;

    ws.on('message', (msg) => {
        if (isFirstPacket) {
            isFirstPacket = false;
            // Разбор заголовка протокола VLESS
            if (msg.length < 22) return ws.close();
            const clientUuid = msg.slice(1, 17).toString('hex');
            if (clientUuid !== uuid) return ws.close();

            const portIndex = 17 + msg[17] + 1;
            const targetPort = msg.readUInt16BE(portIndex);
            const atype = msg[portIndex + 2];
            let targetHost = '';

            if (atype === 1) { // IPv4
                targetHost = msg.slice(portIndex + 3, portIndex + 7).join('.');
            } else if (atype === 2) { // Domain name
                const hostLen = msg[portIndex + 3];
                targetHost = msg.slice(portIndex + 4, portIndex + 4 + hostLen).toString();
            } else {
                return ws.close();
            }

            // Подключение к конечному сайту
            remoteSocket = net.connect(targetPort, targetHost, () => {
                ws.send(Buffer.from([msg[0], 0])); // Ответ клиенту об успешном соединении
            });

            remoteSocket.on('data', (data) => {
                if (ws.readyState === WebSocket.OPEN) ws.send(data);
            });

            remoteSocket.on('close', () => ws.close());
            remoteSocket.on('error', () => ws.close());
        } else {
            if (remoteSocket && remoteSocket.writable) {
                remoteSocket.write(msg);
            }
        }
    });

    ws.on('close', () => { if (remoteSocket) remoteSocket.destroy(); });
    ws.on('error', () => { if (remoteSocket) remoteSocket.destroy(); });
});

server.listen(port, () => {
    console.log(`VLESS Server is running on port ${port}`);
});
