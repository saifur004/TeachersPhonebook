// Admin configuration (local-only).
// IMPORTANT: This does NOT provide real security. If you publish to Play Store,
// the password can be extracted from the app package. For real security, use a server/Firebase.

// Recommended: store a salted SHA-256 hash (so the password is not visible in plain text).
// Generate it with: `python tools/hash_admin_password.py`
window.PHONEBOOK_ADMIN_PASSWORD_SALT = "";
window.PHONEBOOK_ADMIN_PASSWORD_HASH = "";

// Legacy (less secure): plain password. Use a long password (8+ characters).
window.PHONEBOOK_ADMIN_PASSWORD = "CHANGE_THIS_PASSWORD";

// Optional: hide the Admin button (open Admin Panel by long-pressing the logo).
window.PHONEBOOK_HIDE_ADMIN_ENTRY = true;
