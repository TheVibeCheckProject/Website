document.addEventListener('sanctuary-unlocked', function() {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Mystical Forest Ambient Soundscape

    // Gentle Rustling Wind
    var windNoise = audioContext.createWhiteNoise();
    var windFilter = audioContext.createBiquadFilter();
    var windLFO = audioContext.createOscillator();

    windNoise.start(0);
    windNoise.connect(windFilter);
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(200, audioContext.currentTime);
    windFilter.Q.value = 1;
    windFilter.connect(audioContext.destination);

    windLFO.type = 'sine';
    windLFO.frequency.setValueAtTime(0.1, audioContext.currentTime);
    windLFO.connect(windFilter.frequency);
    windLFO.start(0);

    function WhiteNoise(context) {
        var bufferSize = 4 * context.sampleRate,
            buffer = context.createBuffer(1, bufferSize, context.sampleRate),
            output = buffer.getChannelData(0);

        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        var whiteNoise = context.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        return whiteNoise;
    }

    audioContext.createWhiteNoise = function() {
        return WhiteNoise(this);
    };

    // Subterranean Earth Drone
    var droneOsc1 = audioContext.createOscillator();
    var droneOsc2 = audioContext.createOscillator();
    var droneGain = audioContext.createGain();

    droneOsc1.type = 'sine';
    droneOsc1.frequency.setValueAtTime(54, audioContext.currentTime);
    droneOsc1.connect(droneGain);

    droneOsc2.type = 'sine';
    droneOsc2.frequency.setValueAtTime(108, audioContext.currentTime);
    droneOsc2.connect(droneGain);

    droneGain.gain.setValueAtTime(0.05, audioContext.currentTime);
    droneGain.connect(audioContext.destination);

    droneOsc1.start(0);
    droneOsc2.start(0);

    // Night Forest Chirps
    function createChirp() {
        var chirpOsc = audioContext.createOscillator();
        var chirpGain = audioContext.createGain();
        var now = audioContext.currentTime;

        chirpOsc.type = 'sine';
        chirpOsc.frequency.setValueAtTime(800, now);
        chirpOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.5);

        chirpGain.gain.setValueAtTime(0.1, now);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        chirpOsc.connect(chirpGain);
        chirpGain.connect(audioContext.destination);

        chirpOsc.start(now);
        chirpOsc.stop(now + 0.5);
    }

    setInterval(createChirp, Math.random() * 3000 + 2000);

    // Resonant Crystal Singing Bowl Chime
    window.playCrystalChime = function(frequency, duration) {
        var chimeOsc = audioContext.createOscillator();
        var chimeGain = audioContext.createGain();
        var now = audioContext.currentTime;

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(frequency, now);
        chimeOsc.connect(chimeGain);

        chimeGain.gain.setValueAtTime(0.5, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        chimeGain.connect(audioContext.destination);

        chimeOsc.start(now);
        chimeOsc.stop(now + duration);
    };

    // Audio Toggle Button
    var audioToggle = document.getElementById('audio-toggle');
    var isMuted = false;

    audioToggle.addEventListener('click', function() {
        isMuted = !isMuted;
        audioContext.resume().then(() => {
            audioContext[isMuted ? 'suspend' : 'resume']();
            audioToggle.textContent = isMuted ? 'Unmute' : 'Mute';
        });
    });
});