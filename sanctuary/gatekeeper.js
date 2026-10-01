document.getElementById('enter').addEventListener('click', async () => {
    const passphrase = document.getElementById('passphrase').value.trim().toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // SHA-256 of 'vibecheck'
    if (hashHex === '63a55e87a056aff67a8a2b8d740d0d23f82ebdff343d9524128640f8f3f0ea3b') {
        document.getElementById('gateway').style.transition = 'opacity 1.5s ease-out';
        document.getElementById('gateway').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('gateway').style.display = 'none';
        }, 1500);
    } else {
        alert('Incorrect passphrase. Try again.');
    }
});