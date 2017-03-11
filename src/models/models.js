var Sequelize = require('sequelize');

var sequelize = new Sequelize('sycommy_shop', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },

});

var SYCustomer = require('./sycustomer',Sequelize,sequelize);
var Customer = require('./customer',Sequelize,sequelize);
var Order = require('./order',Sequelize,sequelize);