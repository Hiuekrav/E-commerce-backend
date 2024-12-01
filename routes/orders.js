const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');


// GET all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.fetchAll({ withRelated: ['status', 'items.product'] });
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
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching orders', details: err.message });
    }
});

// GET user's orders
router.get('/user/:username', async (req, res) => {
    try {
        const orders = await Order.where({ username: req.params.username }).fetchAll({ withRelated: ['status', 'items.product'], require: false });
        if (!orders || orders.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'No orders found for the user' });
        }
        res.json(orders);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch user orders' });
    }
});

// GET orders by id
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.where({ id: req.params.id }).fetchAll({ withRelated: ['status', 'items.product'], require: false });
        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'No order found for the given id' });
        }
        res.json(order);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch user orders' });
    }
});

// POST new order
router.post('/', async (req, res) => {
    const { username, email, phone, items } = req.body;

    if (!username || !email || !phone || !Array.isArray(items) || items.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Invalid order data' });
    }

    try {
        //Walidacja numeru telefonu i email
        const phoneRegex = /^\+?[0-9]+$/;
        if (!phoneRegex.test(phone)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid phone number' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid email address' });
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
    } catch (error) {
        console.error('Error creating order:', error); // Log błędu
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create order', details: error.message });
    }
});

// PATCH order status
router.patch('/:id', async (req, res) => {
    const { status_id } = req.body;

    if (!status_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid status ID' });
    }

    try {
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

        order.set('status_id', status_id);
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update order status' });
    }
});

// GET orders with specified status
router.get('/status/:id', async (req, res) => {
    try {
        const orders = await Order.where({ status_id: req.params.id }).fetchAll({ withRelated: ['status', 'items.product'], require: false });
        if (!orders || orders.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'No orders found for the given status' });
        }
        res.json(orders);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch orders by status' });
    }
});

module.exports = router;
