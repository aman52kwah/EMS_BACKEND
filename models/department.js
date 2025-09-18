import { DataTypes } from "sequelize";

import { sequelize as sequelizePromise } from '../db/db.js';



async function defineDepartment(){
    const sequelize = await sequelizePromise;
    if (!sequelize) {
        throw new Error('Sequelize instance is undefined. Check db.js configuration.');
    }
    const Department = sequelize.define(
    'Department', {
        id:{
            type:DataTypes.UUID,
            primaryKey:true,
            defaultValue:DataTypes.UUIDV4
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
        tableName: 'departments',
        timestamps:false,
    });
    return Department;
}


const DepartmentPromise = defineDepartment().catch((error) => {
    console.error('Failed to define Department model:', error);
    throw error;
});

export { DepartmentPromise as Department };