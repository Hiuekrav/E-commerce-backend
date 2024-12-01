const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
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
        res.status(StatusCodes.NOT_FOUND).send('Product not found');
    }
});

// POST new product
router.post('/', async (req, res) => {
    try {
        const product = await new Product(req.body).save();
        res.status(StatusCodes.CREATED).json(product);
    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).send(err.message);
    }
});

//PUT updated product
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.where({ id: req.params.id }).fetch();
        if (!product) {
            return res.status(StatusCodes.NOT_FOUND).send('Product not found');
        }
        const updatedProduct = await product.save(req.body, {patch: true});
        res.json(updatedProduct);
    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).send(err.message);
    }
});

module.exports = router;
