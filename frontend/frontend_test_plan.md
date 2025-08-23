# Frontend Authentication Test Plan

## 1. Login Tests
- [ ] Username login: cashier1 / cashier123
- [ ] Email login: cashier@example.com / cashier123
- [ ] Testuser login: testuser / testuser123
- [ ] Newuser login: newuser / newuser123

## 2. Error Handling Tests
- [ ] Wrong password shows error message
- [ ] Non-existent user shows error message
- [ ] Empty fields show validation errors

## 3. Session Management Tests
- [ ] Token persists after page refresh
- [ ] Logout clears token and redirects to login
- [ ] Protected routes redirect unauthenticated users

## 4. User Experience Tests
- [ ] Loading states during authentication
- [ ] Error messages are user-friendly
- [ ] Success redirects to correct page
