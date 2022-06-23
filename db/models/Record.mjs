import { DataTypes } from "sequelize";

export default {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  tag: {
    type: DataTypes.STRING,
  },
  name: {
    type: DataTypes.STRING,
  },
  clan: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.BIGINT,
  },
};
