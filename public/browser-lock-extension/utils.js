// utils.js - Code Commandos Hub Integration

// Wrapper for saving to chrome.storage.local
async function saveToStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

// Wrapper for reading from chrome.storage.local
async function getFromStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result || {});
    });
  });
}

// Get or generate persistent Device ID
async function getDeviceId() {
  const data = await getFromStorage(['deviceId']);
  if (data.deviceId) return data.deviceId;

  const newId = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
  await saveToStorage({ deviceId: newId });
  return newId;
}

// Get or set Device Name
async function getDeviceName() {
  const data = await getFromStorage(['deviceName']);
  return data.deviceName || 'Chrome Workstation';
}

// Get Hub Server URL (defaults to Vercel production or custom URL)
async function getHubApiUrl() {
  const data = await getFromStorage(['hubApiUrl']);
  return (data.hubApiUrl || 'https://code-commandos-hub-14z9.vercel.app').replace(/\/$/, '');
}

// Send Heartbeat to Code Commandos Server
async function sendHeartbeat(options = {}) {
  try {
    const deviceId = await getDeviceId();
    const deviceName = await getDeviceName();
    const hubUrl = await getHubApiUrl();
    const storageData = await getFromStorage(['isLocked', 'password']);

    const payload = {
      deviceId,
      deviceName,
      localIsLocked: storageData.isLocked || false,
      password: storageData.password || '1234',
      event: options.event || undefined,
      eventDetails: options.eventDetails || undefined
    };

    const res = await fetch(`${hubUrl}/api/browser-lock/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return { success: false, error: 'Server returned ' + res.status };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}
