const { bookshelf } = require('../db');

const OrderStatus = bookshelf.model('OrderStatus', {
    tableName: 'order_status',
});

module.exports = OrderStatus;