document.addEventListener('DOMContentLoaded', async () => {
  const passwordInput = document.getElementById('passwordInput');
  const unlockBtn = document.getElementById('unlockBtn');
  const errorMsg = document.getElementById('errorMsg');

  // Listen for remote unlock signal from Hub
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isLocked !== undefined) {
      if (changes.isLocked.newValue === false) {
        // Unlocked remotely by Admin!
        handleSuccessUnlock(false);
      }
    }
  });

  async function handleUnlock() {
    const enteredPass = passwordInput.value.trim();
    if (!enteredPass) return;

    const data = await getFromStorage(['password', 'savedSession']);
    const currentPass = data.password || '1234';

    if (enteredPass === currentPass) {
      // Correct password
      errorMsg.textContent = '';
      
      // Notify Hub server
      sendHeartbeat({
        event: 'local_unlock',
        eventDetails: 'User entered correct password on lock screen'
      }).catch(console.error);

      await handleSuccessUnlock(true);
    } else {
      // Incorrect password
      errorMsg.textContent = 'Incorrect PIN / Password. Try again.';
      passwordInput.value = '';
      passwordInput.focus();

      // Notify Hub server of failed attempt
      sendHeartbeat({
        event: 'failed_unlock',
        eventDetails: 'Failed attempt with input: ' + enteredPass
      }).catch(console.error);

      // Shake animation
      const container = document.querySelector('.lock-container');
      if (container) {
        container.style.animation = 'none';
        container.offsetHeight; /* trigger reflow */
        container.style.animation = 'shake 0.4s';
      }
    }
  }

  async function handleSuccessUnlock(fromLocalInput = true) {
    await saveToStorage({ isLocked: false });

    const data = await getFromStorage(['savedSession']);

    // Restore Windows
    if (data.savedSession && data.savedSession.length > 0) {
      for (let winData of data.savedSession) {
        if (winData.urls && winData.urls.length > 0) {
          try {
            chrome.windows.create({
              url: winData.urls,
              state: winData.state || 'normal'
            });
          } catch (e) {}
        }
      }
    } else {
      try {
        chrome.windows.create({});
      } catch (e) {}
    }

    // Close this lock window
    try {
      const currentWin = await new Promise((resolve) => chrome.windows.getCurrent(resolve));
      if (currentWin && currentWin.id) {
        chrome.windows.remove(currentWin.id);
      }
    } catch (e) {}
  }

  unlockBtn.addEventListener('click', handleUnlock);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });
});

// Dynamic shake keyframes
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    50% { transform: translateX(10px); }
    75% { transform: translateX(-10px); }
    100% { transform: translateX(0); }
}`;
document.head.appendChild(style);
