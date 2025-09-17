import { DataTypes } from "sequelize";
const sequelize = require('../db');

const Department = sequelize.define(
    'Department', {
        id:{
            type:DataTypes.UUID,
            primaryKey:true,
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true,
        },
        description:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        manager_id:{
            type:DataTypes.UUID,
            allowNull:true // Manager might not be assigned yet
        },

        created_at:{
            type:DataTypes.DATE,
            allowNull:false,
            defaultValue:DataTypes.NOW,
        },
    },
    {
        tablename: 'departments',
        timestamps:false,
    }
);

module.exports = Department;