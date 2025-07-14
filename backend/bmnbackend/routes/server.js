const net = require('net');

// Set the port the server will listen on
const PORT = 8000;

// Helper to calculate LEN (byte length of "LK")
function getLen(content) {
    return Buffer.from(content).length.toString().padStart(4, '0');
}

// Convert HEX to ASCII string
function hexToAscii(hex) {
    let ascii = '';
    for (let i = 0; i < hex.length; i += 2) {
        ascii += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return ascii;
}

// Create TCP server
const server = net.createServer((socket) => {
    console.log('Device connected');

    socket.on('data', (data) => {
        const hexString = data.toString('hex').toUpperCase(); // Raw HEX
        const asciiMessage = hexToAscii(hexString);           // ASCII
        console.log('Received (HEX):', hexString);
        console.log('Parsed (ASCII):', asciiMessage);

        const match = asciiMessage.match(/^\[(\w+)\*(\d+)\*\w+\*LK.*\]$/);

        if (match) {
            const protocol = match[1]; // e.g., 3G
            const deviceId = match[2]; // e.g., 0304187109
            const responseContent = 'LK';
            const len = getLen(responseContent);

            const response = `[${protocol}*${deviceId}*${len}*${responseContent}]`;

            console.log('Responding with:', response);
            socket.write(response);
        } else {
            console.log('Invalid message format');
        }
    });

    socket.on('end', () => {
        console.log('Device disconnected');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

server.listen(PORT, () => {
    console.log(`TCP Server listening on port ${PORT}`);
});

