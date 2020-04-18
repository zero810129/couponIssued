module.exports = (sequelize, DataTypes) => (
  sequelize.define('user', {
    userid: {
      type: DataTypes.STRING(40),
      allowNull: true,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  }, {
    timestamps: true,
    paranoid: true,
  })
);
