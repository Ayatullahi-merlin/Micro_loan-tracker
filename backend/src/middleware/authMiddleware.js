const jwt = require("jsonwebtoken");
require("dotenv").config();

const jwtSecret =
  process.env.JWT_SECRET || "your_super_secret_jwt_key_change_me_in_production";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // Expecting format: Bearer <token>
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: "Authentication token required." },
    });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { message: "Invalid or expired authentication token." },
      });
    }

    req.user = user;
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required." },
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: { message: "Access denied: Unauthorized role." },
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
};
