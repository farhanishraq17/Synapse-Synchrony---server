export const HttpResponse = (res, status, error, message, data = []) => {
  return res.status(status).json({
    error,
    message,
    data,
  });
};
