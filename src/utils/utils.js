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
