const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;
const SOUNDS_DIR = '/app/sounds';

// Ensure sounds directory exists
if (!fs.existsSync(SOUNDS_DIR)) {
    fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

// Serve static files
app.use(express.static('public'));
app.use('/sounds', express.static(SOUNDS_DIR));

// Get list of available sounds
function getSoundFiles() {
    try {
        const files = fs.readdirSync(SOUNDS_DIR);
        const soundFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp3', '.wav', '.ogg', '.m4a', '.webm'].includes(ext);
        });
        
        return soundFiles.map(file => ({
            name: path.basename(file, path.extname(file)),
            filename: file,
            path: `/sounds/${file}`
        }));
    } catch (error) {
        console.error('Error reading sounds directory:', error);
        return [];
    }
}

// API endpoint to get available sounds
app.get('/api/sounds', (req, res) => {
    res.json(getSoundFiles());
});

// Socket.io connection for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Send current sound list on connection
    socket.emit('sounds-updated', getSoundFiles());
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Watch the sounds directory for changes
const watcher = chokidar.watch(SOUNDS_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
    }
});

watcher
    .on('add', path => {
        console.log(`File ${path} has been added`);
        io.emit('sounds-updated', getSoundFiles());
    })
    .on('change', path => {
        console.log(`File ${path} has been changed`);
        io.emit('sounds-updated', getSoundFiles());
    })
    .on('unlink', path => {
        console.log(`File ${path} has been removed`);
        io.emit('sounds-updated', getSoundFiles());
    });

// Start server
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Sounds directory: ${SOUNDS_DIR}`);
    console.log(`Place your audio files (.mp3, .wav, .ogg, .m4a, .webm) in the sounds directory`);
    
    const sounds = getSoundFiles();
    if (sounds.length === 0) {
        console.log('No sound files found. Add audio files to the sounds directory.');
    } else {
        console.log(`Found ${sounds.length} sound file(s):`, sounds.map(s => s.filename).join(', '));
    }
});