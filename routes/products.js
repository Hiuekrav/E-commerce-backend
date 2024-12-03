const express = require('express');
const router = express.Router();
const { StatusCodes, BAD_REQUEST} = require('http-status-codes');
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

let generateSeoDescription = async function (product) {

    console.log("kategoria produktu: "+ product.related("category").get("name"))

    const apiKey = "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";
    const prompt = `Wygeneruj opis SEO dla podanego produktu. 
    Nazwa: ${product.get("name")}, 
    opis: ${product.get("description")},
    cena: ${product.get("price")},
    waga: ${product.get("weight")},
    kategoria: ${product.related("category").get("name")}.
    Odpowiedz jedynie utworzonym opisem produktu. Maksymalnie 30 słów, nie powtarzaj informacji z zapytania.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama3-8b-8192',
            temperature: 1,
            max_tokens: 30,
            top_p: 1,
            stream: false,
            stop: null
        })
    });

    const data = await response.json();
    console.log("Response data: ", JSON.stringify(data, null, 2));
    return data.choices[0].message?.content;
}

// GET product SEO description
router.get('/:id/seo-description',[
    param("id").isNumeric().withMessage("Identifier must be numeric value ")
], passport.authenticate("jwt", {session : false}), async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(BAD_REQUEST).json({ errors: errors.array() });
    }
    const product = await Product.where({ id: req.params.id }).fetch({ withRelated: ['category'], require: false });

    if (!product || product.length === 0) return res.status(BAD_REQUEST).json("Product not found")
    const description = await generateSeoDescription(product);
    return res.status(StatusCodes.OK).json({description: description});
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
