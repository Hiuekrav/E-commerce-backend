const { bookshelf } = require('../db');

const Product = bookshelf.model('Product', {
    tableName: 'products',
    category() {
        return this.belongsTo('Category', 'category_id');
    },
});

module.exports = Product;