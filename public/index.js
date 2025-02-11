let statusDiv;

window.onload = () => {
    statusDiv = document.getElementById('status');
    document.getElementById('my-button').onclick = () => {
        init();
    }
}
// Camera 
// async function init() {
//     try {
//         updateStatus('Requesting camera access...', 'normal');
//         const stream = await navigator.mediaDevices.getUserMedia({ 
//             video: true,
//             audio: false 
//         });
        
//         updateStatus('Camera access granted, starting stream...', 'success');
//         document.getElementById("video").srcObject = stream;
        
//         const peer = createPeer();
//         stream.getTracks().forEach(track => peer.addTrack(track, stream));
//     } catch (error) {
//         updateStatus('Error: ' + error.message, 'error');
//         console.error('Initialization error:', error);
//     }
// }

// Screen Sharing
async function init() {
    try {
        updateStatus('Requesting screen share access...', 'normal');
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: {
                cursor: "always"
            },
            audio: false
        });

        stream.getVideoTracks()[0].addEventListener('ended', () => {
            updateStatus('Screen sharing has ended', 'normal');
        });
        
        updateStatus('Screen share access granted, starting stream...', 'success');
        document.getElementById("video").srcObject = stream;
        
        const peer = createPeer();
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            updateStatus('Screen sharing permission denied', 'error');
        } else {
            updateStatus('Error: ' + error.message, 'error');
        }
        console.error('Initialization error:', error);
    }
}

function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ]
    });

    peer.oniceconnectionstatechange = () => {
        updateStatus('ICE Connection State: ' + peer.iceConnectionState, 'normal');
        console.log('ICE Connection State:', peer.iceConnectionState);
    };

    peer.onconnectionstatechange = () => {
        console.log('Connection State:', peer.connectionState);
    };

    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    try {
        updateStatus('Creating connection offer...', 'normal');
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        
        const payload = {
            sdp: peer.localDescription
        };

        const { data } = await axios.post(`${SERVER_URL}/broadcast`, payload);
        const desc = new RTCSessionDescription(data.sdp);
        await peer.setRemoteDescription(desc);
        updateStatus('Stream connection established', 'success');
    } catch (error) {
        updateStatus('Connection error: ' + error.message, 'error');
        console.error('Negotiation error:', error);
    }
}

function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
}

