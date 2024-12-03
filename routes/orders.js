const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Opinion = require('../models/Opinion');
const passport = require("./passport");
const { body, validationResult, param} = require("express-validator");

// GET all orders
router.get('/', passport.authenticate("jwt", {session : false}),
    async (req, res) => {
    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    let orders;
    orders = await Order.fetchAll({withRelated: ['status', 'items.product']});

    if(!orders || orders.length === 0){
        return res.status(StatusCodes.NO_CONTENT).send();
    }
    const prettyOrders= orders.map(order => ({
        id: order.get('id'),
        approval_date: order.get('approval_date'),
        status_id: order.get('status_id'),
        username: order.get('username'),
        email: order.get('email'),
        phone: order.get('phone'),
        items: order.related('items').map(item => ({
            quantity: item.get('quantity'),
            product: item.related('product').toJSON()
        }))
    }));
    res.json(prettyOrders);
});

// GET user's orders
router.get('/user/:username', passport.authenticate("jwt", {session : false}),
    async (req, res) => {
    if (req.user.get("role")==="CLIENT" && req.params.username !== req.user.username){
    }
    const orders = await Order.where({ username: req.params.username }).fetchAll({ withRelated: ['status', 'items.product'], require: false });
    if (orders.length === 0) {
        return res.status(StatusCodes.NO_CONTENT).send();
    }
    res.json(orders);
});

// GET order by id
router.get('/:id', passport.authenticate("jwt", {session : false}),
    async (req, res) => {
    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    const orders = await Order.where({ id: req.params.id }).fetchAll({ withRelated: ['status', 'items.product'], require: false });
    if (orders.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'No order found for the given id' });
    }
    res.json(orders);
});

// POST new order
router.post('/',
    [
        [
            body("username").notEmpty().withMessage("username is required"),
            body("email").notEmpty().withMessage("username is required")
                .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).withMessage("email invalid format"),
            body("phone").notEmpty().withMessage("phone number is required")
                .matches(/^\+?[0-9]+$/).withMessage("phone number invalid format"),
            body("items").isArray().withMessage("array of items is required"),
            body("items.*.product_id").notEmpty().withMessage("product_id is required")
                .isNumeric().withMessage("product_id must be numeric"),
            body("items.*.quantity").isNumeric().withMessage("quantity is required"),
        ],
    ], passport.authenticate("jwt", {session : false}), async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.get("role")!=="CLIENT") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }

    const {username, email, phone, items} = req.body;

    if (username !== req.user.get("username")) {
        return res.status(StatusCodes.BAD_REQUEST).send("Unable to create order for different user");
    }

    // Walidacja produktów
    for (const item of items) {
        const product = await Product.where({ id: item.product_id }).fetch({ require: false });
        if (!product) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: `Product with ID ${item.product_id} not found` });
        }
    }
    // Utworzenie zamówienia
    const order = await new Order({
        status_id: 1,
        username: username,
        email: email,
        phone: phone
    }).save();

    // Dodanie pozycji zamówienia
    for (const item of items) {
        await new OrderItem({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
        }).save();
    }

    res.status(StatusCodes.CREATED).json(order);
});

// PATCH order status
router.patch('/:id',
    [
        [
        param("id").isNumeric().withMessage("Identifier must be numeric value "),
        body("status_id").notEmpty().withMessage("Status id is required")
            .isNumeric().withMessage("status_id must be numeric value ")
        ],
    ], passport.authenticate("jwt", {session : false}),
    async (req, res) => {
    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    const { status_id } = req.body;

    if (!status_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid status ID' });
    }

    const order = await Order.where({ id: req.params.id }).fetch({ require: false });
    if (!order) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Order not found' });
    }

    const currentStatus = await OrderStatus.where({ id: order.get('status_id') }).fetch();
    const newStatus = await OrderStatus.where({ id: status_id }).fetch({ require: false });

    if (!newStatus) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid new status' });
    }

    // Walidacja zmiany stanu
    const invalidTransition =
        (currentStatus.get('name') === 'CANCELLED') ||
        (currentStatus.get('name') === 'COMPLETED');

    if (invalidTransition) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid status transition' });
    }
    //todo sprawdzic
    let approval_date = order.get('approval_date');
    if(newStatus.get('name') === 'APPROVED') {
        approval_date = new Date().toISOString();
    }

    order.set({
        'status_id' : status_id,
        'approval_date' : approval_date
    });
    await order.save();

    res.json(order);
});

// GET orders with specified status
router.get('/status/:id',
    [
        param("id").isNumeric().withMessage("Identifier must be numeric value ")
    ],
    passport.authenticate("jwt", {session : false}),
    async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    const orders = await Order.where({ status_id: req.params.id }).fetchAll({ withRelated: ['status', 'items.product'], require: false });
    if (!orders || orders.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'No orders found for the given status' });
    }
    res.json(orders);
});

//POST add opinion to order
router.post('/:id/opinions',[
    [
        param("id").isNumeric().withMessage("Identifier must be numeric value "),
        body("rating").notEmpty().isInt({min:1, max:5}).withMessage("Rating must be between 1 and 5"),
        body("content").notEmpty().withMessage("Content must not be empty")
    ],
], passport.authenticate("jwt", {session : false}),
    async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.get("role")!=="CLIENT") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }

    const orderId = req.params.id;
    const {rating, content} = req.body;

    const order = await Order.where({id: orderId}).fetch({require: false, withRelated: ['status']});
    if (!order || order.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({error: 'Order with provided id not found'});
    }

    // Sprawdzenie statusu
    const statusName = order.related('status').get('name');
    console.log(statusName);
    if (!['COMPLETED', 'CANCELLED'].includes(statusName.toUpperCase())) {
        return res.status(StatusCodes.BAD_REQUEST).json({error: 'Opinion can only be added to COMPLETED or CANCELLED orders'});
    }

    if (req.user.get('username') !== order.get('username')) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: 'You are not authorized to add an opinion to this order' });
    }

    // Dodanie opinii
    const opinion = await new Opinion({
        order_id: orderId,
        rating: rating,
        content: content
    }).save();

    res.status(StatusCodes.CREATED).json({message: 'Opinion added successfully', opinion});
});


module.exports = router;
