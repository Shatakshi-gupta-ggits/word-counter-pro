document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  // Check for saved theme or prefer-color-scheme
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    html.setAttribute('data-theme', 'dark');
  }
  
  themeToggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });

  // Initialize elements
  const textInput = document.getElementById('textInput');
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  const charNoSpaces = document.getElementById('charNoSpaces');
  const readingTime = document.getElementById('readingTime');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const wpmInput = document.getElementById('wpmInput');

  // Default reading speed
  let wordsPerMinute = 200;

  // Update reading speed when changed
  wpmInput.addEventListener('change', (e) => {
    wordsPerMinute = parseInt(e.target.value) || 200;
    updateCounts();
  });

  // Message listener for content script
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "textSelected") {
      textInput.value = request.text;
      updateCounts();
    }
  });

  // Load initial selected text
  function loadInitialText() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => window.getSelection().toString()
      }, (results) => {
        if (results?.[0]?.result) {
          textInput.value = results[0].result;
          updateCounts();
        }
      });
    });
  }

  // Counting logic
  function updateCounts() {
    const text = textInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;
    
    // Reading time calculation
    const minutes = Math.ceil(words / wordsPerMinute);
    const displayTime = minutes <= 1 ? 
      (wordsPerMinute >= words ? '<1 min' : '1 min') : 
      `${minutes} min${minutes > 1 ? 's' : ''}`;

    // Update UI
    wordCount.textContent = words;
    charCount.textContent = chars;
    charNoSpaces.textContent = charsNoSpaces;
    readingTime.textContent = displayTime;
  }

  // Copy functionality
  copyBtn.addEventListener('click', () => {
    const results = `Words: ${wordCount.textContent}
Characters: ${charCount.textContent} 
No Spaces: ${charNoSpaces.textContent}
Reading Time: ${readingTime.textContent}`;
    
    navigator.clipboard.writeText(results)
      .then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy Results', 2000);
      });
  });

  // Clear functionality
  clearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateCounts();
  });

  // Initialize
  loadInitialText();
  textInput.addEventListener('input', updateCounts);
});