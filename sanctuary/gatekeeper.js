document.addEventListener('DOMContentLoaded', () => {
    const passphraseInput = document.getElementById('passphrase');
    const enterButton = document.getElementById('enter');
    const gatewayElement = document.getElementById('gateway');
    const errorMsg = document.getElementById('error-msg');

    const correctHash = '63a55e87a056aff67a8a2b8d740d0d23f82ebdff343d9524128640f8f3f0ea3b';

    function computeSHA256(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        return window.crypto.subtle.digest('SHA-256', data)
            .then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
                return hashHex;
            });
    }

    function unlockSanctuary() {
        gatewayElement.style.opacity = '0';
        gatewayElement.addEventListener('transitionend', () => {
            gatewayElement.style.display = 'none';
        }, { once: true });
        window.dispatchEvent(new CustomEvent('sanctuary-unlocked'));
    }

    function showError() {
        passphraseInput.classList.add('shake');
        errorMsg.textContent = 'The sanctuary remains quiet. Check your passphrase.';
        setTimeout(() => {
            passphraseInput.classList.remove('shake');
        }, 1000); // Duration of shake animation
    }

    function handlePassphraseCheck() {
        const passphrase = passphraseInput.value.trim();
        computeSHA256(passphrase)
            .then(hash => {
                if (hash === correctHash) {
                    unlockSanctuary();
                } else {
                    showError();
                }
            })
            .catch(error => console.error('Error computing hash:', error));
    }

    enterButton.addEventListener('click', handlePassphraseCheck);
    passphraseInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handlePassphraseCheck();
        }
    });
});