// Add this to frontend to debug JWT token permissions
// Paste in browser console when logged in as imran:

// 1. Check what's in localStorage
const token = localStorage.getItem('token');
console.log('Token:', token);

// 2. Decode JWT (simple base64 decode)
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('User from JWT:', payload);
    console.log('Role:', payload.role);
    console.log('Permissions:', payload.permissions);
    console.log('Permission count:', payload.permissions?.length);
}

// 3. Check what AuthContext has
// In React DevTools, find AuthProvider component and check state

// EXPECTED for teacher "imran":
// - role: "teacher"
// - permissions: Array of 8 strings (exact permissions)
// - Should NOT be "school_admin" or "super_admin"
