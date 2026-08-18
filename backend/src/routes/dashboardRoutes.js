const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', authenticateToken, getDashboardSummary);

module.exports = router;
