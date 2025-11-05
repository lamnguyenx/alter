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

document.addEventListener('click', function(e) {
  if (e.altKey && e.target.tagName === 'A') {
    e.preventDefault();
    e.stopPropagation();

    const url = e.target.href;

    // Get the current command to show in notification
    browser.storage.local.get('shellCommand').then((result) => {
      const command = result.shellCommand || 'echo';
      showCommandNotification(command, url);
    });

    browser.runtime.sendMessage({ action: 'executeCommand', url: url });
  }
});
