const { bookshelf } = require('../db');
const Product = require('./Product');
const Order = require('./Order');

const OrderItem = bookshelf.model('OrderItem', {
    tableName: 'order_items',
    product() {
        return this.belongsTo(Product);
    },
    order() {
        return this.belongsTo(Order);
    },
});

module.exports = OrderItem;