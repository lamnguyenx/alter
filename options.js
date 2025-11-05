document.addEventListener('DOMContentLoaded', function() {
  const commandInput = document.getElementById('command');
  const saveButton = document.getElementById('save');
  const testButton = document.getElementById('test');
  const resultDiv = document.getElementById('result');
  const logTextarea = document.getElementById('log');
  const clearLogButton = document.getElementById('clearLog');

  // Logging function
  function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    logTextarea.value += `[${timestamp}] ${message}\n`;
    logTextarea.scrollTop = logTextarea.scrollHeight;
  }

  // Clear log
  clearLogButton.addEventListener('click', function() {
    logTextarea.value = '';
  });

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
      log('ERROR: No command entered');
      return;
    }

    log(`Starting test with command: "${command}" and URL: "https://example.com"`);
    log('Sending message to native host...');

    const startTime = Date.now();

    browser.runtime.sendNativeMessage('altclickshell', {
      command: command,
      url: 'https://example.com'
    }).then((response) => {
      const duration = Date.now() - startTime;
      log(`Received response from native host (${duration}ms)`);

      if (response.success) {
        log(`SUCCESS: Command executed with return code ${response.returncode}`);
        if (response.stdout) {
          log(`STDOUT: ${response.stdout.trim()}`);
        } else {
          log('STDOUT: (no output)');
        }
        if (response.stderr) {
          log(`STDERR: ${response.stderr.trim()}`);
        }
        showResult(`Command executed successfully. Output: ${response.stdout || 'No output'}`, 'success');
      } else {
        log(`ERROR: ${response.error}`);
        showResult(`Error: ${response.error}`, 'error');
      }
    }).catch((error) => {
      const duration = Date.now() - startTime;
      log(`FAILED: Native messaging error after ${duration}ms - ${error.message}`);
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
