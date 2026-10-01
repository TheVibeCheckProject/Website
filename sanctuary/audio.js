document.addEventListener('DOMContentLoaded', () => {
    let audioContext;
    let isMuted = false;

    window.addEventListener('sanctuary-unlocked', () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            initBackgroundDrone();
        }
    });

    function initBackgroundDrone() {
        const rootFrequency = 432; // A=432Hz
        const lowOsc1Frequency = 108;
        const lowOsc2Frequency = 216;

        const oscillatorRoot = audioContext.createOscillator();
        const oscillatorLow1 = audioContext.createOscillator();
        const oscillatorLow2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const lowpassFilter = audioContext.createBiquadFilter();

        oscillatorRoot.type = 'sine';
        oscillatorLow1.type = 'sine';
        oscillatorLow2.type = 'sine';

        oscillatorRoot.frequency.setValueAtTime(rootFrequency, audioContext.currentTime);
        oscillatorLow1.frequency.setValueAtTime(lowOsc1Frequency, audioContext.currentTime);
        oscillatorLow2.frequency.setValueAtTime(lowOsc2Frequency, audioContext.currentTime);

        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(800, audioContext.currentTime);
        lowpassFilter.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 60); // Slow sweep

        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);

        oscillatorRoot.connect(gainNode);
        oscillatorLow1.connect(gainNode);
        oscillatorLow2.connect(gainNode);
        gainNode.connect(lowpassFilter);
        lowpassFilter.connect(audioContext.destination);

        oscillatorRoot.start();
        oscillatorLow1.start();
        oscillatorLow2.start();
    }

    window.playCrystalChime = (frequency, duration) => {
        if (isMuted) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    };

    window.toggleSanctuaryAudio = () => {
        isMuted = !isMuted;
        if (isMuted) {
            audioContext.suspend();
        } else {
            audioContext.resume();
        }
    };
});