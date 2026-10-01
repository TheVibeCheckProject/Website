(function() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 432;
    oscillator.connect(audioContext.destination);
    oscillator.start();
})();