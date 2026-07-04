return res.status(500).json({
  success: false,
  error: error.message
});