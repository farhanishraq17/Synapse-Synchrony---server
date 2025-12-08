import { HttpResponse } from '../utils/HttpResponse.js';

export const signup = async (req, res) => {
  return HttpResponse(res, 200, false, 'Signup Route Accessed');
};

export const login = async (req, res) => {
  return HttpResponse(res, 200, false, 'Login Route Accessed');
};

export const logout = async (req, res) => {
  return HttpResponse(res, 200, false, 'Logout Route Accessed');
};
