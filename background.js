browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'executeCommand') {
    browser.storage.local.get('shellCommand').then((result) => {
      const commandTemplate = result.shellCommand || 'echo';
      browser.runtime.sendNativeMessage('altclickshell', {
        command: commandTemplate,
        url: message.url
      });
    });
  }
});
