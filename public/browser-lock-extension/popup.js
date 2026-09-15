document.addEventListener('DOMContentLoaded', async () => {
  const deviceIdText = document.getElementById('deviceIdText');
  const copyIdBtn = document.getElementById('copyIdBtn');
  const deviceNameInput = document.getElementById('deviceNameInput');
  const connectionBadge = document.getElementById('connectionBadge');
  const lockNowBtn = document.getElementById('lockNowBtn');
  
  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const settingsBox = document.getElementById('settingsBox');
  const arrowIcon = document.getElementById('arrowIcon');
  
  const hubUrlInput = document.getElementById('hubUrlInput');
  const devicePasswordInput = document.getElementById('devicePasswordInput');
  const saveConfigBtn = document.getElementById('saveConfigBtn');
  const configMsg = document.getElementById('configMsg');

  // Load device info & stored settings
  const deviceId = await getDeviceId();
  const deviceName = await getDeviceName();
  const hubUrl = await getHubApiUrl();
  const storageData = await getFromStorage(['password']);

  deviceIdText.textContent = deviceId;
  deviceNameInput.value = deviceName;
  hubUrlInput.value = hubUrl;
  devicePasswordInput.value = storageData.password || '1234';

  // Test Connection to Hub
  checkServerConnection();

  async function checkServerConnection() {
    connectionBadge.textContent = 'Connecting...';
    connectionBadge.className = 'status-badge connecting';

    try {
      const heartbeatRes = await sendHeartbeat();
      if (heartbeatRes && heartbeatRes.success) {
        connectionBadge.textContent = '● Connected to Hub';
        connectionBadge.className = 'status-badge online';
      } else {
        connectionBadge.textContent = '● Hub Unreachable';
        connectionBadge.className = 'status-badge offline';
      }
    } catch (e) {
      connectionBadge.textContent = '● Hub Offline';
      connectionBadge.className = 'status-badge offline';
    }
  }

  // Copy Device ID
  copyIdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(deviceId);
    copyIdBtn.textContent = '✅';
    setTimeout(() => {
      copyIdBtn.textContent = '📋';
    }, 1500);
  });

  // Save Device Name on change
  deviceNameInput.addEventListener('change', async () => {
    const val = deviceNameInput.value.trim() || 'Chrome Workstation';
    await saveToStorage({ deviceName: val });
    checkServerConnection();
  });

  // Manual Lock Browser Button
  lockNowBtn.addEventListener('click', async () => {
    await saveToStorage({ isLocked: true });
    // Report lock to Hub
    sendHeartbeat({ event: 'local_lock', eventDetails: 'User clicked Lock Now in extension popup' }).catch(() => {});
    window.close();
  });

  // Accordion toggle
  toggleSettingsBtn.addEventListener('click', () => {
    settingsBox.classList.toggle('hidden');
    arrowIcon.textContent = settingsBox.classList.contains('hidden') ? '▼' : '▲';
  });

  // Save Hub Config Settings
  saveConfigBtn.addEventListener('click', async () => {
    const newHubUrl = hubUrlInput.value.trim().replace(/\/$/, '') || 'https://code-commandos-hub-14z9.vercel.app';
    const newPass = devicePasswordInput.value.trim() || '1234';

    await saveToStorage({
      hubApiUrl: newHubUrl,
      password: newPass
    });

    configMsg.textContent = 'Settings saved successfully!';
    configMsg.className = 'msg success';

    checkServerConnection();

    setTimeout(() => {
      configMsg.textContent = '';
    }, 2000);
  });
});
