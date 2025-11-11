// Create floating notification function
function showCommandNotification(command, url) {
// Remove existing notification if any
const existing = document.getElementById('altclick-notification');
if (existing) existing.remove();

// Create notification element
const notification = document.createElement('div');
  notification.id = 'altclick-notification';
  notification.textContent = `Running: ${command} ${url}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: #fff;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Create error notification function
function showErrorNotification(message) {
// Remove existing notification if any
const existing = document.getElementById('altclick-notification');
if (existing) existing.remove();

// Create error notification element
const notification = document.createElement('div');
  notification.id = 'altclick-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #8b0000;
    color: #fff;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds (longer for errors)
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Load shortcut configuration with platform-aware defaults
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
let shortcutConfig = {
  ctrl: isMac ? false : true,
  alt: true,
  shift: false,
  meta: isMac ? true : false
};

browser.storage.local.get('shortcutConfig').then((result) => {
  if (result.shortcutConfig) {
    shortcutConfig = result.shortcutConfig;
  }
});

// Function to check if current modifiers match configured shortcut
function modifiersMatch(e) {
  return (
    e.ctrlKey === shortcutConfig.ctrl &&
    e.altKey === shortcutConfig.alt &&
    e.shiftKey === shortcutConfig.shift &&
    e.metaKey === shortcutConfig.meta
  );
}

// Function to handle configurable modifier + click
function handleShortcutClick(e) {
  if (modifiersMatch(e) && e.target.tagName === 'A') {
    e.preventDefault();
    e.stopImmediatePropagation();

    const url = e.target.href;

    // Get the current command to show in notification
    browser.storage.local.get('shellCommand').then((result) => {
      const command = result.shellCommand || 'echo';
      showCommandNotification(command, url);
    });

    browser.runtime.sendMessage({ action: 'executeCommand', url: url });
  }
}

// Listen for both mousedown and click events with capturing
document.addEventListener('mousedown', handleShortcutClick, true);
document.addEventListener('click', handleShortcutClick, true);

// Listen for notification messages from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'showNotification') {
    showCommandNotification(message.command, message.url);
  } else if (message.action === 'showError') {
    showErrorNotification(message.message);
  }
});
