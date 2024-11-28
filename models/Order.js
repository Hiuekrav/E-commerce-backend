const { bookshelf } = require('../db');
const OrderStatus = require('./OrderStatus');
const OrderItem = require('./OrderItem');

const Order = bookshelf.model('Order', {
    tableName: 'orders',
    status() {
        return this.belongsTo(OrderStatus);
    },
    items() {
        return this.hasMany(OrderItem);
    },
});

module.exports = Order;