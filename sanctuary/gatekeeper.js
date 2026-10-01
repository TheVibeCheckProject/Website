document.getElementById('enter').addEventListener('click', async () => {
    const passphrase = document.getElementById('passphrase').value;
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === '40632a4e92a2a07c69992d53bf3d0b2bb2d97ad0f684cf07d4b47eb2c842858b') {
        document.getElementById('gateway').style.transition = 'opacity 2s ease-out';
        document.getElementById('gateway').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('gateway').style.display = 'none';
        }, 2000);
    } else {
        alert('Incorrect passphrase. Try again.');
    }
});