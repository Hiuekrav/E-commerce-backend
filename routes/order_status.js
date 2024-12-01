const express = require('express');
const router = express.Router();
const OrderStatus = require('../models/OrderStatus');

//GET all order statuses
router.get('/', async (req, res) => {
    const orderStatuses = await OrderStatus.fetchAll();
    res.json(orderStatuses);
});

module.exports = router;
