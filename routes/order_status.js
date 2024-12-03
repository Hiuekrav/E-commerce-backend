const express = require('express');
const router = express.Router();
const OrderStatus = require('../models/OrderStatus');
const passport = require("./passport");
const {StatusCodes} = require("http-status-codes");

//GET all order statuses
router.get('/', passport.authenticate("jwt", {session : false}),
    async (req, res) => {
    if (req.user.get('role')!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    const orderStatuses = await OrderStatus.fetchAll();
    if (!orderStatuses || orderStatuses.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'No order statuses found' });
    }
    res.json(orderStatuses);
});

module.exports = router;
