
exports.successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data
  });
};

exports.errorResponse = (res, message, statusCode = 400, field = null) => {
  const response = {
    status: "error",
    message
  };

  if (field) {
    response.field = field;
  }

  return res.status(statusCode).json(response);
};
