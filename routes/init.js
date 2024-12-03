const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { parse } = require('csv-parse/sync'); // Biblioteka do parsowania CSV
const Product = require('../models/Product');
const passport = require("./passport");
const csv = require('csvtojson');
const multer = require('multer');
const upload = multer();


// Utility function to check if data is JSON
const isJson = (data) => {
    try {
        console.log(data.toString())
        JSON.parse(data.toString());
        return true;
    } catch (e) {
        return false;
    }
};


// Middleware for parsing JSON and CSV
const parseData = async (req, res, next) => {
    const contentType = req.headers['content-type'];
    console.log("contentType" + contentType)
    let data = req.body;

    console.log("PARSING DATA")

    if (contentType === 'text/csv' && (contentType.startsWith('multipart/form-data') && req.file)) {
        try {
            console.log("CSV FILE !!!!")
            data = await csv().fromString(req.file ? req.file.buffer.toString() : req.body.toString());
        } catch (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid CSV format' });
        }
    } else if (contentType === 'application/json' && (contentType.startsWith('multipart/form-data') && req.file)) { // Check if the content type is JSON
        try {
            console.log("JSON FILE !!!")
            console.log("file->" + req.file)

            const jsonData = req.file
                ? JSON.parse(req.file.buffer.toString())
                : JSON.parse(req.body.toString());
            // Proceed with jsonData if valid
        } catch (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid JSON format' });
        }
    } else {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Unsupported content type' });
    }

    req.parsedData = data;
    next();
};

// Validation middleware
const validateData = (req, res, next) => {
    const data = req.parsedData;
    const errors = [];

    data.forEach((item, index) => {
        if (!item.name || !item.description || !item.weight || !item.price || !item.category_id) {
            errors.push({ index, error: 'Missing required fields: name, price, or categoryId' });
        }
        if (isNaN(item.price)) {
            errors.push({ index, error: 'Price must be a number' });
        }
        if (!Number.isInteger(item.category_id)) {
            errors.push({ index, error: 'categoryId must be an integer' });
        }
    });

    if (errors.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors });
    }

    next();
};




// POST /init - Inicjalizacja bazy danych
router.post('/', upload.single('file'), parseData, validateData, passport.authenticate("jwt", {session : false}),
    async (req, res) => {
    if (req.user.get("role")!=="WORKER") {
        return res.status(StatusCodes.FORBIDDEN).send();
    }
    // const {format, data} = req.body;




        //Walidacja formatu i danych
    // if(!format || !data || !['json', 'csv'].includes(format.toLowerCase())) {
    //     return res.status(StatusCodes.BAD_REQUEST).json({message: 'Invalid request format format or missing data'});
    // }

    const existingProducts = await Product.fetchAll({ require: false });
    if (existingProducts.length > 0) {
        return res.status(StatusCodes.CONFLICT).json({ error: 'Database already initialized with products' });
    }



    // if (format.toLowerCase() === 'json') {
    //     products = data; //todo parsowanie jsona???
    // }
    // else if (format.toLowerCase() === 'csv') {
    //     // Parsowanie CSV
    //     try {
    //         products = parse(data, {
    //             columns: true,
    //             skip_empty_lines: true,
    //         });
    //     }
    //     catch (error) {
    //         return  res.status(StatusCodes.BAD_REQUEST).json({error: 'Invalid CSV format'});
    //     }
    // }

    const products = req.parsedData.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        weight: item.weight ,
        category_id: item.category_id
    }));

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