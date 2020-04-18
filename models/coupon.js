module.exports = (sequelize, DataTypes) => (
  sequelize.define('coupon', {
    couponNumber: {
      type: DataTypes.STRING(140),
      allowNull: false,
      unique: true,
    },
    useYN: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    PaymentYN: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    expDate: {
      type: DataTypes.STRING(8),
      allowNull: true,
    }
  }, {
    timestamps: true,
    paranoid: true,
  })
);
