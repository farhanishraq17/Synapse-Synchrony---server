import jwt from 'jsonwebtoken';
export const generateVerficationToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateTokenandSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true, // XSS Attack protection
    secure: process.env.NODE_ENV === 'production' ? true : false, // Set to false in local environment
    sameSite: 'strict', // CSRF Attack protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};



/**
 * Convert Markdown to plain text
 * @param {string} markdown - The markdown text to convert
 * @returns {string} - Plain text without markdown formatting
 */
export const MDtoText = (markdown) => {
  if (!markdown) return '';

  let text = markdown;

  // Remove headers (### Header -> Header)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Remove bold (**text** or __text__ -> text)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');

  // Remove italic (*text* or _text_ -> text)
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // Remove strikethrough (~~text~~ -> text)
  text = text.replace(/~~(.*?)~~/g, '$1');

  // Remove inline code (`code` -> code)
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove code blocks (```code``` -> code)
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove images ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');

  // Remove blockquotes (> text -> text)
  text = text.replace(/^>\s+(.+)$/gm, '$1');

  // Remove horizontal rules (--- or ***)
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Remove bullet points (- item or * item -> item)
  text = text.replace(/^[\s]*[-*+]\s+(.+)$/gm, '$1');

  // Remove numbered lists (1. item -> item)
  text = text.replace(/^[\s]*\d+\.\s+(.+)$/gm, '$1');

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Remove extra blank lines (keep max 2 newlines)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  text = text.trim();

  return text;
};