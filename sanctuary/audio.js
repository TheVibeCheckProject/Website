window.addEventListener('sanctuary-unlocked', function() {
    let audioContext;
    let masterGain;
    let isMuted = false;

    const initAudio = () => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.06;
        masterGain.connect(audioContext.destination);

        createAmbientDrone();
        setupAudioToggleButton();
    };

    const createAmbientDrone = () => {
        const oscillatorSub = audioContext.createOscillator();
        const oscillatorBody = audioContext.createOscillator();
        const oscillatorHarmonic = audioContext.createOscillator();
        const filter = audioContext.createBiquadFilter();

        oscillatorSub.type = 'sine';
        oscillatorSub.frequency.setValueAtTime(108, audioContext.currentTime);
        oscillatorSub.connect(filter);

        oscillatorBody.type = 'sine';
        oscillatorBody.frequency.setValueAtTime(216, audioContext.currentTime);
        oscillatorBody.connect(filter);

        oscillatorHarmonic.type = 'sine';
        oscillatorHarmonic.frequency.setValueAtTime(432, audioContext.currentTime);
        oscillatorHarmonic.connect(filter);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, audioContext.currentTime);

        filter.connect(masterGain);

        oscillatorSub.start();
        oscillatorBody.start();
        oscillatorHarmonic.start();

        // LFO for filter frequency
        const lfo = audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, audioContext.currentTime);
        const lfoGain = audioContext.createGain();
        lfoGain.gain.setValueAtTime(250, audioContext.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        lfo.start();
    };

    const setupAudioToggleButton = () => {
        const toggleButton = document.getElementById('audio-toggle');
        toggleButton.addEventListener('click', () => {
            isMuted = !isMuted;
            masterGain.gain.setValueAtTime(isMuted ? 0 : 0.06, audioContext.currentTime);
            toggleButton.textContent = isMuted ? '🔇' : '🔊';
        });
    };

    window.playCrystalChime = function(frequency = 432, duration = 2.5) {
        if (!audioContext || isMuted) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        // Exponential decay for bell-like sound
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    };

    // Resume context on first user gesture
    window.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                initAudio();
            });
        }
    }, { once: true });
});