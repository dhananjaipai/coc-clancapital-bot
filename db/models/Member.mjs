import { DataTypes } from "sequelize";

export default {
  tag: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  donated: {
    type: DataTypes.BIGINT,
  },
  looted: {
    type: DataTypes.BIGINT,
  },
  main: {
    type: DataTypes.STRING,
  },
};
