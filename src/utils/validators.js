// src/utils/validators.js
export const isValidEmail = (email) => {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
};

export const isValidPassword = (pwd) => {
  return typeof pwd === 'string' && pwd.length >= 6;
};
