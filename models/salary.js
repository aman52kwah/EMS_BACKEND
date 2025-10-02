import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';




async function defineSalary(){
    const sequelize = await sequelizePromise;
    if (!sequelize) {
        throw new Error('Sequelize instance is undefined. Check db.js configuration.');
        
    }
    const Salary = sequelize.define(
    'Salary',{
        id:{
            type:DataTypes.UUID,
            primaryKey:true,
        },
        // employee_id:{
        //     type:DataTypes.UUID,
        //     allowNull:true,
        // },
        amount:{
            type:DataTypes.DECIMAL(10,2), // for currency( 100.50)
            allowNull:false,
        },
        currency: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'GHA',
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
    return Salary;
}


    const SalaryPromise = defineSalary().catch((error)=>{
        console.error('Failed to define Salary model:', error)
    });
    export {SalaryPromise as Salary};