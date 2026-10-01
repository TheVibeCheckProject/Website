document.addEventListener('DOMContentLoaded', function() {
    const enterButton = document.getElementById('enter');
    const passphraseInput = document.getElementById('passphrase');
    const gateway = document.getElementById('gateway');
    const errorMsg = document.getElementById('error-msg');

    const correctHash = '63a55e87a056aff67a8a2b8d740d0d23f82ebdff343d9524128640f8f3f0ea3b';

    function hashString(message) {
        return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
            .then(buffer => {
                return Array.from(new Uint8Array(buffer))
                    .map(byte => byte.toString(16).padStart(2, '0'))
                    .join('');
            });
    }

    function unlockSanctuary() {
        gateway.classList.add('fading');
        setTimeout(() => {
            gateway.style.display = 'none';
            window.dispatchEvent(new CustomEvent('sanctuary-unlocked'));
        }, 800);
    }

    function shakeInput() {
        passphraseInput.classList.add('shake');
        setTimeout(() => {
            passphraseInput.classList.remove('shake');
        }, 600);
    }

    function handlePassphrase() {
        const passphrase = passphraseInput.value;
        hashString(passphrase).then(hash => {
            if (hash === correctHash) {
                unlockSanctuary();
                errorMsg.textContent = '';
            } else {
                shakeInput();
                errorMsg.textContent = 'The sanctuary remains quiet. Check your passphrase.';
            }
        });
    }

    enterButton.addEventListener('click', handlePassphrase);
    passphraseInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            handlePassphrase();
        }
    });
});