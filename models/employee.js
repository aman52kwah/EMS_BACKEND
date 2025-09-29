import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineEmployee(){

    const sequelize = await sequelizePromise;
    if (!sequelize) {
        throw new Error("Sequelize instance is undefined. Check db.js configuration.");
        
    }

    const Employee = sequelize.define(
    'Employee',
    {
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
            allowNull:false,
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        email :{
            type:DataTypes.STRING,
            allowNull:true,
            unique:true,
            validate:{isEmail:true},
        },
        department_id :{
            type:DataTypes.UUID,
            allowNull:false,
        },
        role_id:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        hire_date:{
            type:DataTypes.DATE,
            allowNull:false,
            defaultValue:DataTypes.NOW,
        },
        status:{
            type:DataTypes.ENUM('active','inactive','terminated'),
            allowNull:false,
            defaultValue:'active',
        },

    },
    {tableName:'employees',
        timestamps:false,
    }
);
return Employee;
}


const EmployeePromise = defineEmployee().catch((error)=>{
    console.error('Failed to define Employee model:', error);
    throw error;
});

export {EmployeePromise as Employee};