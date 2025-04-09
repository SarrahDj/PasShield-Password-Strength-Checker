
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password-input');
    const togglePassword = document.getElementById('toggle-password');
    const strengthProgress = document.getElementById('strength-progress');
    const lengthCriteria = document.getElementById('length-criteria');
    const uppercaseCriteria = document.getElementById('uppercase-criteria');
    const lowercaseCriteria = document.getElementById('lowercase-criteria');
    const numberCriteria = document.getElementById('number-criteria');
    const specialCriteria = document.getElementById('special-criteria');
    const commonCriteria = document.getElementById('common-criteria');
    
    // Common passwords list (simplified for demo)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome', 'password123'];
    
    let typingTimer;
    
    togglePassword.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePassword.textContent = '🔒';
    } else {
        passwordInput.type = 'password';
        togglePassword.textContent = '👁️';
    }
    });
    
    passwordInput.addEventListener('input', function() {
    clearTimeout(typingTimer);
    checkPasswordStrength(passwordInput.value);
    
    // Set timer to check for final validation after user stops typing
    typingTimer = setTimeout(function() {
        markFailedCriteria(passwordInput.value);
    }, 1000);
    });
    
    function checkPasswordStrength(password) {
    // Reset all to neutral if password is empty
    if (password.length === 0) {
        resetAllCriteria();
        strengthProgress.style.width = '0%';
        strengthProgress.style.backgroundColor = '#e0e0e0';
        return;
    }
    
    // Check each criteria
    checkCriteria(lengthCriteria, password.length >= 8, '✓', '⬤');
    checkCriteria(uppercaseCriteria, /[A-Z]/.test(password), '✓', '⬤');
    checkCriteria(lowercaseCriteria, /[a-z]/.test(password), '✓', '⬤');
    checkCriteria(numberCriteria, /[0-9]/.test(password), '✓', '⬤');
    checkCriteria(specialCriteria, /[^A-Za-z0-9]/.test(password), '✓', '⬤');
    checkCriteria(commonCriteria, !commonPasswords.includes(password.toLowerCase()), '✓', '⬤');
    
    // Update strength meter
    updateStrengthMeter(password);
    }
    
    function markFailedCriteria(password) {
    if (password.length === 0) return;
    
    // Only mark as failures if there's a password but criteria are not met
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
    
    function updateStrengthMeter(password) {
    let strength = 0;
    
    // Calculate percentage based on criteria met
    if (password.length >= 8) strength += 16;
    if (password.length >= 12) strength += 8;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    if (!commonPasswords.includes(password.toLowerCase())) strength += 16;
    
    // Update progress bar
    strengthProgress.style.width = `${strength}%`;
    
    // Color based on strength
    if (strength < 40) {
        strengthProgress.style.backgroundColor = '#f44336'; // Red
    } else if (strength < 70) {
        strengthProgress.style.backgroundColor = '#ff9800'; // Orange
    } else {
        strengthProgress.style.backgroundColor = '#4caf50'; // Green
    }
    }
});