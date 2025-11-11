browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'executeCommand') {
    browser.storage.local.get('shellCommand').then((result) => {
      const commandTemplate = result.shellCommand;
      if (!commandTemplate) {
        console.error('No shell command configured');
        return;
      }
      browser.runtime.sendNativeMessage('clickshell', {
        command: commandTemplate,
        url: message.url
      }).catch((error) => {
        console.error('Failed to execute command:', error);
      });
    }).catch((error) => {
      console.error('Failed to retrieve shell command:', error);
    });
  }
});

// Create context menu item on extension load
browser.contextMenus.create({
  id: 'open-page-clickshell',
  title: 'Open Page via Clickshell',
  contexts: ['page']
});

// Create context menu item for links
browser.contextMenus.create({
  id: 'open-link-clickshell',
  title: 'Open Link via Clickshell',
  contexts: ['link']
});

// Handle context menu item click
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-page-clickshell') {
    browser.storage.local.get('shellCommand').then((result) => {
      const commandTemplate = result.shellCommand;
      if (!commandTemplate) {
        browser.tabs.sendMessage(tab.id, {
          action: 'showError',
          message: 'No shell command configured. Please set a command in settings.'
        }).catch(() => {});
        console.error('No shell command configured');
        return;
      }
      
      // Show notification in the content script
      browser.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        command: commandTemplate,
        url: tab.url
      }).catch(() => {
        // Notification fails silently if content script not available
      });
      
      // Execute the command
      browser.runtime.sendNativeMessage('clickshell', {
        command: commandTemplate,
        url: tab.url
      }).then((response) => {
        console.log('Clickshell command executed:', response);
      }).catch((error) => {
        const stackLines = error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
        const errorMessage = `Error: ${error.message || error}\n${stackLines}`;
        browser.tabs.sendMessage(tab.id, {
          action: 'showError',
          message: errorMessage
        }).catch(() => {});
        console.error('Failed to execute Clickshell command:', error);
      });
    }).catch((error) => {
      const stackLines = error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
      const errorMessage = `Error retrieving command: ${error.message || error}\n${stackLines}`;
      browser.tabs.sendMessage(tab.id, {
        action: 'showError',
        message: errorMessage
      }).catch(() => {});
      console.error('Failed to retrieve shell command:', error);
    });
  } else if (info.menuItemId === 'open-link-clickshell') {
    browser.storage.local.get('shellCommand').then((result) => {
      const commandTemplate = result.shellCommand;
      if (!commandTemplate) {
        browser.tabs.sendMessage(tab.id, {
          action: 'showError',
          message: 'No shell command configured. Please set a command in settings.'
        }).catch(() => {});
        console.error('No shell command configured');
        return;
      }
      
      const linkUrl = info.linkUrl;
      
      // Show notification in the content script
      browser.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        command: commandTemplate,
        url: linkUrl
      }).catch(() => {
        // Notification fails silently if content script not available
      });
      
      // Execute the command
      browser.runtime.sendNativeMessage('clickshell', {
        command: commandTemplate,
        url: linkUrl
      }).then((response) => {
        console.log('Clickshell command executed:', response);
      }).catch((error) => {
        const stackLines = error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
        const errorMessage = `Error: ${error.message || error}\n${stackLines}`;
        browser.tabs.sendMessage(tab.id, {
          action: 'showError',
          message: errorMessage
        }).catch(() => {});
        console.error('Failed to execute Clickshell command:', error);
      });
    }).catch((error) => {
      const stackLines = error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
      const errorMessage = `Error retrieving command: ${error.message || error}\n${stackLines}`;
      browser.tabs.sendMessage(tab.id, {
        action: 'showError',
        message: errorMessage
      }).catch(() => {});
      console.error('Failed to retrieve shell command:', error);
    });
  }
});
