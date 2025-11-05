document.addEventListener('DOMContentLoaded', function() {
  const commandInput = document.getElementById('command');
  const saveButton = document.getElementById('save');
  const testButton = document.getElementById('test');
  const resultDiv = document.getElementById('result');

  // Load saved command
  browser.storage.local.get('shellCommand').then((result) => {
    if (result.shellCommand) {
      commandInput.value = result.shellCommand;
    }
  });

  // Save command
  saveButton.addEventListener('click', function() {
    const command = commandInput.value.trim();
    browser.storage.local.set({ shellCommand: command }).then(() => {
      showResult('Command saved successfully!', 'success');
    });
  });

  // Test command
  testButton.addEventListener('click', function() {
    const command = commandInput.value.trim();
    if (!command) {
      showResult('Please enter a command first', 'error');
      return;
    }

    browser.runtime.sendNativeMessage('altclickshell', {
      command: command,
      url: 'https://example.com'
    }).then((response) => {
      if (response.success) {
        showResult(`Command executed successfully. Output: ${response.stdout || 'No output'}`, 'success');
      } else {
        showResult(`Error: ${response.error}`, 'error');
      }
    }).catch((error) => {
      showResult(`Failed to execute: ${error.message}`, 'error');
    });
  });

  function showResult(message, type) {
    resultDiv.textContent = message;
    resultDiv.style.display = 'block';
    resultDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    resultDiv.style.color = type === 'success' ? '#155724' : '#721c24';
  }
});
