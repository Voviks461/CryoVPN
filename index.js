const WebSocket = require('ws');
const http = require('http');

const port = process.env.PORT || 10000;
const uuid = process.env.UUID || "0653b692a07a934b9ef41b17f1f0f696"; 

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        // Трафик
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
