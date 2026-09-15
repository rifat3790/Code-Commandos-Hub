importScripts('utils.js');

let isLocked = false;
let lockWindowId = null;
let lockEnforcementInProgress = false;

// Initialize state
async function init() {
  const localData = await getFromStorage(['isLocked', 'password', 'deviceId']);
  
  // Ensure deviceId exists
  await getDeviceId();

  isLocked = localData.isLocked || false;

  if (isLocked) {
    enforceLock();
  }

  // Initial heartbeat
  runHeartbeatCheck();
}

init();

// Periodic Heartbeat loop (every 3 seconds)
async function runHeartbeatCheck() {
  try {
    const res = await sendHeartbeat();
    if (res && res.success) {
      // Sync password if admin updated it
      if (res.password) {
        await saveToStorage({ password: res.password });
      }

      // Check remote lock state
      if (res.isLocked === true && !isLocked) {
        console.log('[Lock Bridge] Remote Lock command received from Hub!');
        isLocked = true;
        await saveToStorage({ isLocked: true });
        enforceLock();
      } else if (res.isLocked === false && isLocked) {
        console.log('[Lock Bridge] Remote Unlock command received from Hub!');
        unlockRoutine();
      }
    }
  } catch (e) {
    console.error('[Lock Bridge] Heartbeat sync failed:', e);
  }
}

// 3.5-second recurring heartbeat interval
setInterval(runHeartbeatCheck, 3500);

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.isLocked !== undefined) {
    isLocked = changes.isLocked.newValue;
    if (isLocked) {
      enforceLock();
    }
  }
});

async function enforceLock() {
  if (lockEnforcementInProgress) return;
  lockEnforcementInProgress = true;

  try {
    // First, save current session before closing windows
    await saveSessionState();

    const windows = await new Promise((resolve) => chrome.windows.getAll({ populate: false }, resolve));

    let existing = windows.find((w) => w.id === lockWindowId);
    if (!existing) {
      const url = chrome.runtime.getURL('lock.html');
      const lockWin = await new Promise((resolve) =>
        chrome.windows.create(
          {
            url: url,
            type: 'popup',
            width: 480,
            height: 600,
            focused: true
          },
          resolve
        )
      );
      lockWindowId = lockWin.id;
    }

    // Close all other normal windows
    for (let win of windows) {
      if (win.id !== lockWindowId) {
        try {
          chrome.windows.remove(win.id);
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    lockEnforcementInProgress = false;
  }
}

async function unlockRoutine() {
  isLocked = false;
  await saveToStorage({ isLocked: false });

  const data = await getFromStorage(['savedSession']);

  // Restore Session windows
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
    chrome.windows.create({});
  }

  // Close the lock window if open
  if (lockWindowId) {
    try {
      chrome.windows.remove(lockWindowId);
    } catch (e) {}
    lockWindowId = null;
  }
}

// Aggressively prevent new windows while locked
chrome.windows.onCreated.addListener((window) => {
  if (!isLocked) return;
  if (lockEnforcementInProgress) return;

  if (window.id !== lockWindowId) {
    try {
      chrome.windows.remove(window.id);
    } catch (e) {}
  }
});

// Re-enforce lock if lock window was manually closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (!isLocked) return;
  if (lockEnforcementInProgress) return;

  if (windowId === lockWindowId) {
    lockWindowId = null;
    enforceLock();
  }
});

// Session State Saving
async function saveSessionState() {
  if (isLocked) return;

  const windows = await new Promise((resolve) => chrome.windows.getAll({ populate: true }, resolve));
  const sessionToSave = [];

  for (let win of windows) {
    if (win.type !== 'normal') continue;

    let tabUrls = [];
    for (let tab of win.tabs) {
      let url = tab.url || tab.pendingUrl;
      if (url && !url.startsWith('chrome-extension://' + chrome.runtime.id)) {
        tabUrls.push(url);
      }
    }

    if (tabUrls.length > 0) {
      sessionToSave.push({
        state: win.state === 'minimized' ? 'normal' : win.state,
        urls: tabUrls
      });
    }
  }

  if (sessionToSave.length > 0) {
    await saveToStorage({ savedSession: sessionToSave });
  }
}

let saveTimeout = null;
function triggerSessionSave() {
  if (isLocked) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSessionState, 600);
}

chrome.tabs.onUpdated.addListener(triggerSessionSave);
chrome.tabs.onRemoved.addListener(triggerSessionSave);
chrome.tabs.onCreated.addListener(triggerSessionSave);
