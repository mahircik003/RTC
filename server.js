const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const webrtc = require("wrtc");
const cors = require('cors');
const os = require('os');
const https = require('https');
const fs = require('fs');

let senderStream;

// SSL/TLS certificate configuration
const sslOptions = {
    key: fs.readFileSync('cert.key'),  // Replace with your key path
    cert: fs.readFileSync('cert.crt')  // Replace with your certificate path
};

// Enable CORS for all routes
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.post("/consumer", async ({ body }, res) => {
    console.log("Consumer connection attempt");
    try {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" }
            ]
        });

        peer.oniceconnectionstatechange = () => {
            console.log("Consumer ICE Connection State:", peer.iceConnectionState);
        };

        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        
        if (senderStream) {
            senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
        } else {
            console.log("Warning: No sender stream available");
        }
        
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        
        res.json({ sdp: peer.localDescription });
    } catch (error) {
        console.error("Consumer error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/broadcast', async ({ body }, res) => {
    console.log("Broadcast connection attempt");
    try {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" }
            ]
        });

        peer.oniceconnectionstatechange = () => {
            console.log("Broadcaster ICE Connection State:", peer.iceConnectionState);
        };

        peer.ontrack = (e) => handleTrackEvent(e, peer);
        
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        
        res.json({ sdp: peer.localDescription });
    } catch (error) {
        console.error("Broadcast error:", error);
        res.status(500).json({ error: error.message });
    }
});

function handleTrackEvent(e, peer) {
    console.log("Received broadcaster track");
    senderStream = e.streams[0];
}

// Get local IP address
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

const PORT = 5000;
const IP = 'IP';

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

httpsServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure server running at https://${IP}:${PORT}`);
    console.log('Use this IP address in your client configuration');
});
