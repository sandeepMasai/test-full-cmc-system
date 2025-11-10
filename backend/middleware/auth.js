const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header only
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.warn(' No token found in Authorization header');
      return res.status(401).json({ message: 'Access token required' });
    }

    //  Verify JWT signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.warn(' Token expired');
        return res.status(401).json({ message: 'Token expired. Please log in again.' });
      }
      console.warn(' Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    //  Find user from DB
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      console.warn(' No user found for token userId:', decoded.userId);
      return res.status(401).json({ message: 'Invalid user' });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated. Please contact administrator.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error(' Authentication error:', error.message);
    return res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
