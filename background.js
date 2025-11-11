browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'executeCommand') {
    browser.storage.local.get('shellCommand').then((result) => {
      const commandTemplate = result.shellCommand || 'echo';
      browser.runtime.sendNativeMessage('clickshell', {
        command: commandTemplate,
        url: message.url
      });
    });
  }
});
