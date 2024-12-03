const express = require('express');
const bodyParser = require('body-parser');
const { loadInitData } = require('./db');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const orderStatusRoutes = require('./routes/order_status');
const categoryRoutes = require('./routes/categories');
const loginRoutes = require('./routes/login');

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/order_status', orderStatusRoutes);
app.use('/categories', categoryRoutes);
app.use('/', loginRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
        await loadInitData();
    }
    catch (err) {
        console.error("Error loading init data", err.message);
    }
});