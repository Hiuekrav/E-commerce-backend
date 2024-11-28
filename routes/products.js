const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
    const products = await Product.fetchAll({ withRelated: ['category'] });
    res.json(products);
});

// GET product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.where({ id: req.params.id }).fetch({ withRelated: ['category'] });
        res.json(product);
    } catch {
        res.status(404).send('Product not found');
    }
});

// POST new product
router.post('/', async (req, res) => {
    try {
        const product = await new Product(req.body).save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;
