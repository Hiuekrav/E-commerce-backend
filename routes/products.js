const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const Product = require('../models/Product');
const passport = require("./passport");
const { body, validationResult, param} = require("express-validator");

// GET all products
router.get('/', passport.authenticate("jwt", {session : false}), async (req, res) => {
    const products = await Product.fetchAll({ withRelated: ['category'] });
    if(products.length === 0) {
        return res.status(StatusCodes.NO_CONTENT).send();
    }
    res.json(products);
});

// GET product by ID
router.get('/:id',[
    param("id").isNumeric().withMessage("Identifier must be numeric value ")
], passport.authenticate("jwt", {session : false}), async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const product = await Product.where({ id: req.params.id }).fetch({ withRelated: ['category'] });
        res.json(product);
    } catch {
        res.status(StatusCodes.NOT_FOUND).send('Product not found');
    }
});

// POST new product
router.post('/',[
        [
            body("name").notEmpty().withMessage("name is required"),
            body("price").notEmpty().withMessage("price is required"),
            body("description").notEmpty().withMessage("description is required"),
            body("weight").notEmpty().withMessage("weight is required"),
            body("category_id").notEmpty().withMessage("category_id is required")
                .isNumeric().withMessage("category_id must be numeric value"),
        ],
    ], passport.authenticate("jwt", {session: false}),
    async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    try {
        const product = await new Product(req.body).save();
        res.status(StatusCodes.CREATED).json(product);
    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).send(err.message);
    }
});

//PUT updated product
router.put('/:id', [
        [
            param("id").isNumeric().withMessage("Identifier must be numeric value "),
            body("name").notEmpty().optional(),
            body("price").notEmpty().optional(),
            body("description").notEmpty().optional(),
            body("weight").notEmpty().optional(),
            body("category_id").notEmpty().isNumeric().optional(),
        ],
    ],
    passport.authenticate("jwt", { session: false }),  async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    const product = await Product.where({ id: req.params.id }).fetch();
    if (!product) {
        return res.status(StatusCodes.BAD_REQUEST).send('Product with provided id not found');
    }
    try {
        const updatedProduct = await product.save(req.body, {patch: true});
        res.json(updatedProduct);
    }
    catch (err) {
        res.status(StatusCodes.BAD_REQUEST).send('Product does not have given parameter(s)');
    }
});

module.exports = router;
