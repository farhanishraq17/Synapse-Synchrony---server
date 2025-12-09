import jwt from 'jsonwebtoken';
import { HttpResponse } from '../utils/HttpResponse.js';
export const VerifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return HttpResponse(res, 401, true, 'Unauthorized: No token provided');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded)
      return HttpResponse(res, 401, true, 'Unauthorized: Invalid token');
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
