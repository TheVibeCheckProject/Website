function playSanctuaryChime() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, audioContext.currentTime); // 432Hz harmonic

        // Smooth bell envelope (fade-in, gentle decay)
        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 3.5);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + 3.5);
    } catch (e) {
        console.warn("Audio chime:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const enterBtn = document.getElementById('enter');
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            // Trigger audio upon unlock interaction
            playSanctuaryChime();
        });
    }
});