var THREE = window.THREE;

document.addEventListener('DOMContentLoaded', function() {
    var gateway = document.getElementById('gateway');
    var passphraseInput = document.getElementById('passphrase-input');
    var errorMsg = document.getElementById('error-msg');

    passphraseInput.addEventListener('input', function() {
        errorMsg.textContent = ''; // Clear previous error message
    });

    passphraseInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            verifyPassphrase();
        }
    });

    document.getElementById('verify-button').addEventListener('click', verifyPassphrase);

    function verifyPassphrase() {
        var passphrase = passphraseInput.value;
        var expectedHash = '63a55e87a056aff67a8a2b8d740d0d23f82ebdff343d9524128640f8f3f0ea3b';

        // Compute SHA-256 hash of the passphrase
        crypto.subtle.digest('SHA-256', new TextEncoder().encode(passphrase))
            .then(function(hashBuffer) {
                var hashArray = Array.from(new Uint8Array(hashBuffer));
                var hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

                if (hashHex === expectedHash) {
                    gateway.classList.add('fading');
                    setTimeout(function() {
                        gateway.style.display = 'none';
                        window.dispatchEvent(new CustomEvent('sanctuary-unlocked'));
                    }, 800);
                } else {
                    shakeInput();
                    errorMsg.textContent = 'The forest remains quiet. Check your passphrase.';
                }
            })
            .catch(function(error) {
                console.error('Error computing hash:', error);
                shakeInput();
                errorMsg.textContent = 'An error occurred. Please try again later.';
            });
    }

    function shakeInput() {
        passphraseInput.classList.add('shake');
        setTimeout(function() {
            passphraseInput.classList.remove('shake');
        }, 800);
    }
});