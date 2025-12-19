import User from '../models/User.js';
import { HttpResponse } from '../utils/HttpResponse.js';

export const GetAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return HttpResponse(res, 200, false, 'Users Retrieved Successfully', users);
  } catch (error) {
    console.error(error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};
