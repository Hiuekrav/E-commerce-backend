const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET all categories
router.get('/', async (req, res) => {

    const categories = await Category.fetchAll();
    res.json(categories);
});

module.exports = router;

