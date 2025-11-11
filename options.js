document.addEventListener('DOMContentLoaded', function() {
  const templatesSelect = document.getElementById('templates');
  const commandInput = document.getElementById('command');
  const previewUrlInput = document.getElementById('preview-url');
  const previewCommand = document.getElementById('preview-command');
  const ctrlCheckbox = document.getElementById('ctrl');
  const altCheckbox = document.getElementById('alt');
  const shiftCheckbox = document.getElementById('shift');
  const metaCheckbox = document.getElementById('meta');
  const ctrlLabel = document.getElementById('ctrl-label');
  const metaLabel = document.getElementById('meta-label');
  const runNowButton = document.getElementById('run-now');
  const resultDiv = document.getElementById('result');
  const saveSettingsButton = document.getElementById('save-settings');

  // Track whether form has unsaved changes
  let hasUnsavedChanges = false;

  function markAsChanged() {
    hasUnsavedChanges = true;
    saveSettingsButton.disabled = false;
  }

  function saveSettings() {
    const command = commandInput.value.trim();
    const previewUrl = previewUrlInput.value.trim();
    const shortcutConfig = {
      ctrl: ctrlCheckbox.checked,
      alt: altCheckbox.checked,
      shift: shiftCheckbox.checked,
      meta: metaCheckbox.checked
    };
    
    browser.storage.local.set({ 
      shellCommand: command, 
      shortcutConfig: shortcutConfig, 
      previewUrl: previewUrl 
    }).then(() => {
      hasUnsavedChanges = false;
      saveSettingsButton.disabled = true;
      showResult('Settings saved successfully', 'success');
    }).catch((error) => {
      showResult(`Failed to save settings: ${error.message}`, 'error');
    });
  }

  // Platform-aware labels
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  ctrlLabel.textContent = isMac ? 'Ctrl' : 'Ctrl';  // Ctrl is still Ctrl
  metaLabel.textContent = isMac ? 'Cmd' : 'Meta';

  // Simple shell quoting function for preview
  function shellQuote(str) {
    if (/[^\w@%+=:,./-]/.test(str)) {
      return "'" + str.replace(/'/g, "'\"'\"'") + "'";
    } else {
      return str;
    }
  }

  // Function to update command preview and banner
  function updatePreview() {
    const command = commandInput.value.trim();
    const previewUrl = previewUrlInput.value.trim() || 'https://example.com';
    const banner = document.getElementById('url-placeholder-banner');

    if (command.includes('{{url}}')) {
      banner.style.display = 'none';
      const escapedUrl = shellQuote(previewUrl);
      const preview = command.replace(/\{\{url\}\}/g, escapedUrl);
      previewCommand.textContent = preview;
    } else {
      banner.style.display = 'block';
      const escapedUrl = shellQuote(previewUrl);
      previewCommand.textContent = `${command} ${escapedUrl}`;
    }
  }

  // Template selection
  templatesSelect.addEventListener('change', function() {
    if (templatesSelect.value) {
      commandInput.value = templatesSelect.value;
      updatePreview();
      markAsChanged();
    }
  });

  // Mark as changed on input
  commandInput.addEventListener('input', () => {
    updatePreview();
    markAsChanged();
  });

  previewUrlInput.addEventListener('input', () => {
    updatePreview();
    markAsChanged();
  });

  // Mark as changed on checkbox changes
  [ctrlCheckbox, altCheckbox, shiftCheckbox, metaCheckbox].forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      markAsChanged();
    });
  });

  // Handle save button click
  saveSettingsButton.addEventListener('click', saveSettings);

  // Load saved settings
  browser.storage.local.get(['shellCommand', 'shortcutConfig', 'previewUrl']).then((result) => {
    let commandToUse = result.shellCommand;
    
    // If no command is saved, use the first template (Firefox Android ADB)
    if (!commandToUse) {
      const defaultTemplate = templatesSelect.options[0].value;
      commandToUse = defaultTemplate;
      // Immediately save the default template
      browser.storage.local.set({ shellCommand: commandToUse });
    }
    
    commandInput.value = commandToUse;
    if (result.previewUrl) {
      previewUrlInput.value = result.previewUrl;
    }
    // Load shortcut config with platform-aware defaults
    const defaultCtrl = !isMac;  // Ctrl on non-Mac
    const defaultMeta = isMac;   // Cmd on Mac
    ctrlCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.ctrl !== undefined) ? result.shortcutConfig.ctrl : defaultCtrl;
    altCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.alt !== undefined) ? result.shortcutConfig.alt : true;
    shiftCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.shift !== undefined) ? result.shortcutConfig.shift : false;
    metaCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.meta !== undefined) ? result.shortcutConfig.meta : defaultMeta;

    updatePreview();

    // Reset change tracking since we just loaded saved settings
    hasUnsavedChanges = false;
    saveSettingsButton.disabled = true;
  });



  // Run now
  runNowButton.addEventListener('click', function() {
    const command = commandInput.value.trim();
    if (!command) {
      showResult('Please enter a command first', 'error');
      return;
    }

    browser.runtime.sendNativeMessage('clickshell', {
      command: command,
      url: previewUrlInput.value.trim() || 'https://example.com'
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
