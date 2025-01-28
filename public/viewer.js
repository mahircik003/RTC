// window.onload = () => {
//     document.getElementById('my-button').onclick = () => {
//         init();
//     }
// }

// async function init() {
//     const peer = createPeer();
//     peer.addTransceiver("video", { direction: "recvonly" })
// }

// function createPeer() {
//     const peer = new RTCPeerConnection({
//         iceServers: [
//             {
//                 urls: "stun:stun.stunprotocol.org"
//             }
//         ]
//     });
//     peer.ontrack = handleTrackEvent;
//     peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

//     return peer;
// }

// async function handleNegotiationNeededEvent(peer) {
//     const offer = await peer.createOffer();
//     await peer.setLocalDescription(offer);
//     const payload = {
//         sdp: peer.localDescription
//     };

//     const { data } = await axios.post('/consumer', payload);
//     const desc = new RTCSessionDescription(data.sdp);
//     peer.setRemoteDescription(desc).catch(e => console.log(e));
// }

// function handleTrackEvent(e) {
//     document.getElementById("video").srcObject = e.streams[0];
// };



let statusDiv;

window.onload = () => {
    statusDiv = document.getElementById('status');
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

async function init() {
    try {
        updateStatus('Connecting to stream...', 'normal');
        const peer = createPeer();
        peer.addTransceiver("video", { direction: "recvonly" });
    } catch (error) {
        updateStatus('Error: ' + error.message, 'error');
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

    peer.ontrack = handleTrackEvent;
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

        const { data } = await axios.post(`${SERVER_URL}/consumer`, payload);
        const desc = new RTCSessionDescription(data.sdp);
        await peer.setRemoteDescription(desc);
        updateStatus('Connected to stream', 'success');
    } catch (error) {
        updateStatus('Connection error: ' + error.message, 'error');
        console.error('Negotiation error:', error);
    }
}

function handleTrackEvent(e) {
    updateStatus('Receiving video stream', 'success');
    document.getElementById("video").srcObject = e.streams[0];
}

function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
}