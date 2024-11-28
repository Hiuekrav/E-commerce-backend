const express = require('express');
const bodyParser = require('body-parser');

const productRoutes = require('./routes/products');

const app = express();
app.use(bodyParser.json());

// Routes
    app.use('/products', productRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});