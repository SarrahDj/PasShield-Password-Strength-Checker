document.addEventListener('DOMContentLoaded', function() {
    const strengthProgress = document.getElementById('strength-progress');
    const lengthCriteria = document.getElementById('length-criteria');
    const uppercaseCriteria = document.getElementById('uppercase-criteria');
    const lowercaseCriteria = document.getElementById('lowercase-criteria');
    const numberCriteria = document.getElementById('number-criteria');
    const specialCriteria = document.getElementById('special-criteria');
    const commonCriteria = document.getElementById('common-criteria');
    
    // Adding criteria to HTML dynamically (haka it will be easy to add more )
    const criteriaList = document.querySelector('.criteria-list');
    
    const sequenceCriteria = document.createElement('li');
    sequenceCriteria.className = 'criteria-item';
    sequenceCriteria.id = 'sequence-criteria';
    sequenceCriteria.innerHTML = '<span class="icon neutral">⬤</span>No obvious sequences or patterns';
    criteriaList.appendChild(sequenceCriteria);
    
    const pwnedCriteria = document.createElement('li');
    pwnedCriteria.className = 'criteria-item';
    pwnedCriteria.id = 'pwned-criteria';
    pwnedCriteria.innerHTML = '<span class="icon neutral">⬤</span>Not found in data breaches';
    criteriaList.appendChild(pwnedCriteria);
    
    const zxcvbnCriteria = document.createElement('li');
    zxcvbnCriteria.className = 'criteria-item';
    zxcvbnCriteria.id = 'zxcvbn-criteria';
    zxcvbnCriteria.innerHTML = '<span class="icon neutral">⬤</span>Strong entropy score';
    criteriaList.appendChild(zxcvbnCriteria);
    
    const timeToBreakContainer = document.createElement('div');
    timeToBreakContainer.className = 'time-to-break';
    timeToBreakContainer.style.margin = '12px 0';
    timeToBreakContainer.style.fontSize = '13px';
    timeToBreakContainer.style.color = '#666';
    timeToBreakContainer.innerHTML = '<span id="time-to-break">Time to crack: -</span>';
    document.body.insertBefore(timeToBreakContainer, document.querySelector('.footer'));
    
    // message element
    const statusMessage = document.createElement('div');
    statusMessage.id = 'status-message';
    statusMessage.style.fontSize = '12px';
    statusMessage.style.textAlign = 'center';
    statusMessage.style.padding = '4px';
    statusMessage.style.borderRadius = '4px';
    statusMessage.style.marginBottom = '8px';
    statusMessage.style.display = 'none';
    document.body.insertBefore(statusMessage, document.querySelector('.footer'));
    
    // Load zxcvbn for entropy 
    const zxcvbnScript = document.createElement('script');
    zxcvbnScript.src = 'https://cdn.jsdelivr.net/npm/zxcvbn@4.4.2/dist/zxcvbn.js';
    document.head.appendChild(zxcvbnScript);
    
    // Common sequences and patterns to check 
    const commonSequences = [
        '123', '234', '345', '456', '567', '678', '789', '987', '876', '765', '654', '543', '432', '321',
        'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop',
        'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
        'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
        'zxc', 'xcv', 'cvb', 'vbn', 'bnm'
    ];
    
    // Common passwords list ( I'll look for a file to clone as well )
    const commonPasswords = [
        'password', '123456', 'qwerty', 'admin', 'welcome', 'password123', 
        'abc123', 'letmein', '123456789', '12345678', '1234567890', 'iloveyou',
        'sunshine', 'princess', 'admin123', '123123', 'dragon', 'baseball',
        'football', 'monkey', 'superman', 'master', 'welcome123', 'login',
        'qwerty123'
    ];
    
    // Keyboard layout patterns
    const keyboardRows = [
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm'
    ];
    
    let typingTimer;
    let checkingPwned = false;
    let pwnedCache = {};
    let currentPassword = '';
    
    function processPassword(password) {
        currentPassword = password;
        clearTimeout(typingTimer);
        checkPasswordStrength(password);
        
        // Set timer to check for final validation after user stops typing
        typingTimer = setTimeout(function() {
            markFailedCriteria(password);
            
            // Only check HIBP API if password is at least 5 chars long
            if (password.length >= 5) {
                checkHaveIBeenPwned(password);
            } else {
                checkCriteria(pwnedCriteria, false, '✓', '⬤', false);
            }
        }, 800);
    }
    
    function checkPasswordStrength(password) {
        // Reset all to neutral if password is empty
        if (password.length === 0) {
            resetAllCriteria();
            strengthProgress.style.width = '0%';
            strengthProgress.style.backgroundColor = '#e0e0e0';
            document.getElementById('time-to-break').textContent = 'Time to crack: -';
            return;
        }
        
        // Basic criteria checks
        checkCriteria(lengthCriteria, password.length >= 8, '✓', '⬤');
        checkCriteria(uppercaseCriteria, /[A-Z]/.test(password), '✓', '⬤');
        checkCriteria(lowercaseCriteria, /[a-z]/.test(password), '✓', '⬤');
        checkCriteria(numberCriteria, /[0-9]/.test(password), '✓', '⬤');
        checkCriteria(specialCriteria, /[^A-Za-z0-9]/.test(password), '✓', '⬤');
        checkCriteria(commonCriteria, !commonPasswords.includes(password.toLowerCase()), '✓', '⬤');
        checkCriteria(sequenceCriteria, !hasCommonSequence(password), '✓', '⬤');
        
        // Check for zxcvbn 
        if (typeof zxcvbn !== 'undefined') {
            const result = zxcvbn(password);
            checkCriteria(zxcvbnCriteria, result.score >= 3, '✓', '⬤');
            
            // Update crack time ( provided by zxcvbn as well )
            document.getElementById('time-to-break').textContent = 
                `Time to crack: ${result.crack_times_display.offline_fast_hashing_1e10_per_second}`;
            
            // Update strength meter based on zxcvbn score
            const strengthPercentage = (result.score / 4) * 100;
            strengthProgress.style.width = `${strengthPercentage}%`;
            
            // Color based on zxcvbn score
            if (result.score <= 1) {
                strengthProgress.style.backgroundColor = '#f44336'; // Red
            } else if (result.score <= 2) {
                strengthProgress.style.backgroundColor = '#ff9800'; // Orange
            } else if (result.score <= 3) {
                strengthProgress.style.backgroundColor = '#ffeb3b'; // Yellow
            } else {
                strengthProgress.style.backgroundColor = '#4caf50'; // Green
            }
        } else {
            // Fallback if zxcvbn isn't loaded yet
            const basicStrength = calculateBasicStrength(password);
            strengthProgress.style.width = `${basicStrength}%`;
            
            if (basicStrength < 40) {
                strengthProgress.style.backgroundColor = '#f44336'; // Red
            } else if (basicStrength < 70) {
                strengthProgress.style.backgroundColor = '#ff9800'; // Orange
            } else {
                strengthProgress.style.backgroundColor = '#4caf50'; // Green
            }
        }
    }
    
    function markFailedCriteria(password) {
        if (password.length === 0) return;
        
        // Basic criteria failures
        if (password.length > 0 && password.length < 8) {
            checkCriteria(lengthCriteria, false, '✓', '✗', true);
        }
        if (password.length > 0 && !/[A-Z]/.test(password)) {
            checkCriteria(uppercaseCriteria, false, '✓', '✗', true);
        }
        if (password.length > 0 && !/[a-z]/.test(password)) {
            checkCriteria(lowercaseCriteria, false, '✓', '✗', true);
        }
        if (password.length > 0 && !/[0-9]/.test(password)) {
            checkCriteria(numberCriteria, false, '✓', '✗', true);
        }
        if (password.length > 0 && !/[^A-Za-z0-9]/.test(password)) {
            checkCriteria(specialCriteria, false, '✓', '✗', true);
        }
        if (commonPasswords.includes(password.toLowerCase())) {
            checkCriteria(commonCriteria, false, '✓', '✗', true);
        }
        if (hasCommonSequence(password)) {
            checkCriteria(sequenceCriteria, false, '✓', '✗', true);
        }
        
        // zxcvbn check if available
        if (typeof zxcvbn !== 'undefined') {
            const result = zxcvbn(password);
            checkCriteria(zxcvbnCriteria, result.score >= 3, '✓', '✗', result.score < 3);
        }
    }
    
    function checkCriteria(element, isValid, validIcon, invalidIcon, markInvalid = false) {
        const iconElement = element.querySelector('.icon');
        
        if (isValid) {
            element.style.color = '#2e7d32';
            iconElement.textContent = validIcon;
            iconElement.className = 'icon success';
        } else if (markInvalid) {
            element.style.color = '#c62828';
            iconElement.textContent = invalidIcon;
            iconElement.className = 'icon error';
        } else {
            element.style.color = '#888';
            iconElement.textContent = invalidIcon;
            iconElement.className = 'icon neutral';
        }
    }
    
    function resetAllCriteria() {
        const criteriaItems = document.querySelectorAll('.criteria-item');
        criteriaItems.forEach(item => {
            const iconElement = item.querySelector('.icon');
            item.style.color = '#888';
            iconElement.textContent = '⬤';
            iconElement.className = 'icon neutral';
        });
    }
    
    // Calculate basic strength (used as fallback)
    function calculateBasicStrength(password) {
        let strength = 0;
        
        // Length
        if (password.length >= 8) strength += 15;
        if (password.length >= 12) strength += 10;
        if (password.length >= 16) strength += 10;
        
        // Character types
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^A-Za-z0-9]/.test(password)) strength += 15;
        
        // Common weaknesses
        if (!commonPasswords.includes(password.toLowerCase())) strength += 5;
        if (!hasCommonSequence(password)) strength += 5;
        
        // Cap at 100%
        return Math.min(strength, 100);
    }
    
    // Check if password contains common sequences or keyboard patterns
    function hasCommonSequence(password) {
        const lowerPass = password.toLowerCase();
        
        // Check for common sequences
        for (const seq of commonSequences) {
            if (lowerPass.includes(seq)) {
                return true;
            }
        }
        
        // Check for keyboard patterns
        for (const row of keyboardRows) {
            for (let i = 0; i < row.length - 2; i++) {
                const forwardSeq = row.substring(i, i + 3);
                const reverseSeq = forwardSeq.split('').reverse().join('');
                
                if (lowerPass.includes(forwardSeq) || lowerPass.includes(reverseSeq)) {
                    return true;
                }
            }
        }
        
        // Check for repeated characters
        for (let i = 0; i < lowerPass.length - 2; i++) {
            if (lowerPass[i] === lowerPass[i+1] && lowerPass[i] === lowerPass[i+2]) {
                return true;
            }
        }
        
        return false;
    }
    
    // Check if password appears in Have I Been Pwned database
    function checkHaveIBeenPwned(password) {
        // Skip if already checking
        if (checkingPwned) return;
        
        // Check cache first
        if (password in pwnedCache) {
            updatePwnedStatus(pwnedCache[password]);
            return;
        }
        
        // Generate SHA-1 hash of password
        generateSHA1(password).then(hash => {
            const hashPrefix = hash.substring(0, 5);
            const hashSuffix = hash.substring(5).toUpperCase();
            
            // Show loading status
            checkingPwned = true;
            showStatus("Checking breach database...", 'info');
            checkCriteria(pwnedCriteria, false, '✓', '⟳', false);
            
            // Call the HIBP API with k-anonymity (only sending first 5 chars)
            fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.text();
                })
                .then(data => {
                    // Parse the response
                    const hashList = data.split('\r\n');
                    let found = false;
                    let occurrences = 0;
                    
                    for (const line of hashList) {
                        const [lineHashSuffix, count] = line.split(':');
                        if (lineHashSuffix === hashSuffix) {
                            found = true;
                            occurrences = parseInt(count);
                            break;
                        }
                    }
                    
                    // Cache the result
                    pwnedCache[password] = {
                        found: found,
                        occurrences: occurrences
                    };
                    
                    // Update UI
                    updatePwnedStatus(pwnedCache[password]);
                    checkingPwned = false;
                    hideStatus();
                })
                .catch(error => {
                    console.error('Error checking HIBP:', error);
                    checkCriteria(pwnedCriteria, false, '✓', '!', false);
                    pwnedCriteria.title = 'Error checking breach database';
                    showStatus("Could not check breach database", 'error');
                    checkingPwned = false;
                });
        });
    }
    
    // Helper to update the UI with pwned status
    function updatePwnedStatus(status) {
        if (status.found) {
            // Password was found in data breaches
            checkCriteria(pwnedCriteria, false, '✓', '✗', true);
            pwnedCriteria.title = `Found in data breaches ${status.occurrences.toLocaleString()} times`;
            
            if (status.occurrences > 1000) {
                showStatus(`WARNING: This password has been exposed in ${status.occurrences.toLocaleString()} data breaches!`, 'error');
            } else {
                showStatus(`This password has been exposed in ${status.occurrences.toLocaleString()} data breaches.`, 'warning');
            }
        } else {
            // Password not found in breaches
            checkCriteria(pwnedCriteria, true, '✓', '⬤', false);
            pwnedCriteria.title = 'Not found in known data breaches';
            hideStatus();
        }
    }
    
    // Generate SHA-1 hash
    async function generateSHA1(input) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Show status message
    function showStatus(message, type) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
        statusMessage.style.display = 'block';
        
        // Set color based on message type
        if (type === 'error') {
            statusMessage.style.backgroundColor = '#ffebee';
            statusMessage.style.color = '#c62828';
        } else if (type === 'warning') {
            statusMessage.style.backgroundColor = '#fff3e0';
            statusMessage.style.color = '#ef6c00';
        } else if (type === 'info') {
            statusMessage.style.backgroundColor = '#e3f2fd';
            statusMessage.style.color = '#1565c0';
        } else if (type === 'success') {
            statusMessage.style.backgroundColor = '#e8f5e9';
            statusMessage.style.color = '#2e7d32';
        }
    }
    
    // Hide status message
    function hideStatus() {
        const statusMessage = document.getElementById('status-message');
        statusMessage.style.display = 'none';
    }
    
    // Listen for messages from content script
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'CHECK_PASSWORD') {
            processPassword(event.data.password);
        }
    });
    
    // Notify parent when loaded
    window.parent.postMessage({type: 'CHECKER_READY'}, '*');
});