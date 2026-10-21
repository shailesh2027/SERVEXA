const express = require('express');
const router = express.Router();
const jwt =:: 'YOUR_JWT_SECRET'; // Use environment variable in production

// Hardcoded or Database based operator check (Aap apne hisab se DB model bhi use kar sakte hain)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Example credentials (Aap ise apne database se bhi match kar sakte hain)
        if (username === process.env.OPERATOR_USER && password === process.env.OPERATOR_PASS) {
            // Generate JWT token valid for 2 hours
            const token = jwt.sign({ role: 'operator', username }, JWT_SECRET, { expiresIn: '2h' });
            return res.status(200).json({ success: true, token, message: 'Login successful!' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid operator credentials!' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
