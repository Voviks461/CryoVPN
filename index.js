import { createServer } from 'http';
import { connect } from 'net';
import { WebSocketServer, createWebSocketStream } from 'ws';

const uuid = (process.env.UUID || '0653b692a07a934b9ef41b17f1f0f696').replace(/-/g, '');
const port = process.env.PORT || 10000;

const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server Active');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    ws.once('message', (msg) => {
        const [version, id, addonLen] = [msg[0], msg.slice(1, 17), msg[17]];
        if (id.toString('hex') !== uuid) return ws.close();
        
        let i = 18 + addonLen;
        const port = msg.readUInt16BE(i);
        const atype = msg[i + 2];
        let host = '';
        
        if (atype === 1) host = msg.slice(i + 3, i + 7).join('.');
        else if (atype === 2) host = msg.slice(i + 4, i + 4 + msg[i + 3]).toString();
        else if (atype === 3) host = msg.slice(i + 3, i + 19).toString('hex').match(/.{1,4}/g).join(':');
        
        const socket = connect(port, host, () => {
            const stream = createWebSocketStream(ws);
            if (msg.length > i + 3 + (atype === 2 ? msg[i + 3] + 1 : atype === 1 ? 4 : 16)) {
                socket.write(msg.slice(msg.length - stream.readableLength));
            }
            stream.pipe(socket).pipe(stream);
        });
        
        socket.on('error', () => ws.close());
        ws.on('error', () => socket.destroy());
    });
});

server.listen(port, () => console.log(`VLESS open on ${port}`));
