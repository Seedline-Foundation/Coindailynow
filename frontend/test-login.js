// Super Admin Login Test Script
// Run this in the browser console to test the login process

console.log('=== Super Admin Login Test ===');

// Test 1: Check if we can access the login form
const usernameInput = document.querySelector('input[type="text"], input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');
const submitButton = document.querySelector('button[type="submit"]');

console.log('Form elements found:', {
  usernameInput: !!usernameInput,
  passwordInput: !!passwordInput,
  submitButton: !!submitButton
});

// Test 2: Fill in credentials
if (usernameInput && passwordInput) {
  usernameInput.value = 'admin';
  passwordInput.value = 'admin123';
  
  // Trigger React state updates
  usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  console.log('Credentials filled in');
  
  // Test 3: Submit the form
  setTimeout(() => {
    if (submitButton) {
      console.log('Clicking submit button...');
      submitButton.click();
    }
  }, 1000);
} else {
  console.error('Could not find form elements');
}

// Test 4: Check for localStorage token after login
setTimeout(() => {
  const token = localStorage.getItem('super_admin_token');
  console.log('Token in localStorage:', token);
}, 5000);