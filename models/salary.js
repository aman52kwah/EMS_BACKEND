import { type } from "os";
import { DataTypes } from "sequelize";
const sequelize = require('../db');


const Salary = sequelize.define(
    'Salary',{
        id:{
            type:DataTypes.UUID,
            primaryKey:true,
        },
        employee_id:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        amount:{
            type:DataTypes.DECIMAL(10,2), // for currency( 100.50)
            allowNull:false,
        },
        effective_date:{
            type:DataTypes.DATE,
            allowNull:false,
            defaultValue:DataTypes.NOW,
        },
        salary_type:{
            type:DataTypes.ENUM('hourly','monthly','annual'),
            allowNull:false,
        },
    },

    {
        tableName:'salary',
        timestamps:false,
    });

    module.exports = Salary;