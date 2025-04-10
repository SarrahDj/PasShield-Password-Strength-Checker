// Track currently active password field
let activePasswordField = null;
let checkerVisible = false;
let iframe = null;
let closeButton = null;

// Listen for focus events on password fields
document.addEventListener('focusin', function(e) {
    if (e.target.type === 'password') {
        activePasswordField = e.target;
        showPasswordChecker(e.target);
    }
});

// Listen for blur events to potentially hide the checker
document.addEventListener('focusout', function(e) {
    if (e.target.type === 'password') {
        // Small delay to avoid closing if clicking inside the iframe
        setTimeout(() => {
            const activeElement = document.activeElement;
            if (activeElement !== e.target && !isElementInChecker(activeElement)) {
                hidePasswordChecker();
            }
        }, 200);
    }
});

// Listen for input events on password fields
document.addEventListener('input', function(e) {
    if (e.target.type === 'password' && e.target === activePasswordField && checkerVisible) {
        sendPasswordToChecker(e.target.value);
    }
});

// Listen for keydown events to hide checker on Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && checkerVisible) {
        hidePasswordChecker();
    }
});

// Show the password checker popup
function showPasswordChecker(passwordField) {
    if (checkerVisible) return;
    
    // Create iframe for our extension
    iframe = document.createElement('iframe');
    iframe.id = 'pw-strength-checker-popup';
    iframe.style.position = 'absolute';
    iframe.style.zIndex = '999999';
    iframe.style.border = '1px solid #ccc';
    iframe.style.borderRadius = '4px';
    iframe.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    iframe.style.background = '#fff';
    iframe.style.width = '320px';
    iframe.style.height = '320px';
    
    // Position near the password field
    const rect = passwordField.getBoundingClientRect();
    
    // Check if there's enough space below the password field
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 330) {
        // Position above if not enough space below
        iframe.style.top = (rect.top + window.scrollY - 325) + 'px';
    } else {
        // Position below
        iframe.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    }
    
    // Horizontal positioning
    if (rect.left + 320 > window.innerWidth) {
        // Align with right edge of password field
        iframe.style.left = (rect.right + window.scrollX - 320) + 'px';
    } else {
        // Align with left edge
        iframe.style.left = (rect.left + window.scrollX) + 'px';
    }
    
    // Load extension HTML
    iframe.src = chrome.runtime.getURL('index.html');
    
    document.body.appendChild(iframe);
    
    // Add close button
    closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.zIndex = '1000000';
    closeButton.style.background = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '20px';
    closeButton.style.height = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.fontSize = '16px';
    closeButton.style.lineHeight = '1';
    
    // Position close button
    if (spaceBelow < 330) {
        closeButton.style.top = (parseInt(iframe.style.top) + 300) + 'px';
    } else {
        closeButton.style.top = iframe.style.top;
    }
    closeButton.style.left = (parseInt(iframe.style.left) + 300) + 'px';
    
    closeButton.addEventListener('click', function() {
        hidePasswordChecker();
    });
    
    document.body.appendChild(closeButton);
    checkerVisible = true;
    
    // Listen for messages from the iframe
    window.addEventListener('message', handleIframeMessages);
    
    // Send initial password value if there is one
    if (passwordField.value) {
        setTimeout(() => {
            sendPasswordToChecker(passwordField.value);
        }, 500); // Small delay to ensure iframe is loaded
    }
}

// Hide the password checker
function hidePasswordChecker() {
    if (iframe) {
        iframe.remove();
        iframe = null;
    }
    if (closeButton) {
        closeButton.remove();
        closeButton = null;
    }
    checkerVisible = false;
    window.removeEventListener('message', handleIframeMessages);
}

// Send password to the checker iframe
function sendPasswordToChecker(password) {
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'CHECK_PASSWORD',
            password: password
        }, '*');
    }
}

// Handle messages from the iframe
function handleIframeMessages(event) {
    if (event.data && event.data.type === 'CHECKER_READY') {
        // If checker is ready and we have an active password, send it
        if (activePasswordField && activePasswordField.value) {
            sendPasswordToChecker(activePasswordField.value);
        }
    }
}

// Utility to check if an element is within our checker
function isElementInChecker(element) {
    return element === iframe || element === closeButton || 
           (iframe && iframe.contentDocument && 
            iframe.contentDocument.contains(element));
}

// Handle page unload or navigation
window.addEventListener('beforeunload', function() {
    hidePasswordChecker();
});

// Handle clicks outside the password field and checker
document.addEventListener('click', function(e) {
    if (checkerVisible && 
        e.target !== activePasswordField && 
        !isElementInChecker(e.target)) {
        hidePasswordChecker();
    }
});