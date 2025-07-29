module.exports = (sequelize, DataTypes) => {
  const User2FA = sequelize.define('User2FA', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false
    },
    backupCodes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  return User2FA;
};
