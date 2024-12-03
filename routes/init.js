const express = require('express');
const router = express.Router();
const { StatusCodes, BAD_REQUEST} = require('http-status-codes');
const { parse } = require('csv-parse/sync'); // Biblioteka do parsowania CSV
const Product = require('../models/Product');
const passport = require("./passport");
const {body} = require("express-validator");

// POST /init - Inicjalizacja bazy danych
router.post('/',
    passport.authenticate("jwt", {session : false}),
    async (req, res) => {
    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    const {format, data} = req.body;

    //Walidacja formatu i danych
    if(!format || !data || !['json', 'csv'].includes(format.toLowerCase())) {
        return res.status(StatusCodes.BAD_REQUEST).json({message: 'Invalid request format format or missing data'});
    }

    const existingProducts = await Product.fetchAll({ require: false });
    if (existingProducts.length > 0) {
        return res.status(StatusCodes.CONFLICT).json({ error: 'Database already initialized with products' });
    }

    let products;

    if (format.toLowerCase() === 'json') {
        products = data;
    }
    else if (format.toLowerCase() === 'csv') {
        // Parsowanie CSV
        try {
            products = parse(data, {
                columns: true,
                skip_empty_lines: true,
            });
        }
        catch (error) {
            return  res.status(StatusCodes.BAD_REQUEST).json({error: 'Invalid CSV format'});
        }
    }

    // Walidacja i zapis produktów
    const createdProducts = [];
    for (const product of products) {
        const {name, description, price, weight, category_id} = product;

        // Dodanie produktu do bazy
        const newProduct = await new Product({
            name,
            description,
            price,
            weight,
            category_id,
        }).save();

        createdProducts.push(newProduct);
    }

    return res.status(200).json({
        message: 'Database initialized successfully',
        products: createdProducts,
    });

});

module.exports = router;