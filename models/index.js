const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require('./user')(sequelize, Sequelize);
db.Coupon = require('./coupon')(sequelize, Sequelize);
db.Domain = require('./domain')(sequelize, Sequelize);



db.User.hasMany(db.Coupon);
db.Coupon.belongsTo(db.User);

db.User.hasMany(db.Domain);
db.Domain.belongsTo(db.User);


module.exports = db;
