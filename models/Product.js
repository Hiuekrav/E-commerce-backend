const { bookshelf } = require('../db');
const Category = require('./Category');

const Product = bookshelf.model('Product', {
    tableName: 'products',
    category() {
        return this.belongsTo(Category);
    },
});

module.exports = Product;