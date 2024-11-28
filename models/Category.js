const { bookshelf } = require('../db');

const Category = bookshelf.model('Category', {
    tableName: 'categories',
});

module.exports = Category;