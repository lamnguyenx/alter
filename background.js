browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'executeCommand') {
    browser.storage.local.get('shellCommand').then((result) => {
      const command = result.shellCommand || 'echo';
      browser.runtime.sendNativeMessage('altclickshell', {
        command: command,
        url: message.url
      });
    });
  }
});
