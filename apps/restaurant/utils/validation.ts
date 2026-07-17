export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  // Min 8 chars, at least 1 uppercase, at least 1 number
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

export function isValidPhone(phone: string): boolean {
  // Accepts formats: +1234567890, 1234567890, (123) 456-7890, etc.
  const phoneRegex =
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,5}[-\s.]?[0-9]{1,5}$/;
  return phoneRegex.test(phone.trim());
}

export function isEmpty(value: string): boolean {
  return value.trim().length === 0;
}
