const jwt = require('jsonwebtoken');
const JWT_SECRET = 'YOUR_JWT_SECRET';

const verifyOperator = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access denied! No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'operator') {
            return res.status(403).json({ success: false, message: 'Access forbidden! Not an operator.' });
        }
        req.operator = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token!' });
    }
};

module.exports = verifyOperator;
