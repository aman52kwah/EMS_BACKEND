import { DataTypes } from "sequelize";

import { sequelize as sequelizePromise } from '../db/db.js';



async function defineManager(){
    const sequelize = await sequelizePromise;
    if (!sequelize) {
        throw new Error('Sequelize instance is undefined. Check db.js configuration.');
    }
    const Manager = sequelize.define(
    'Manager', {
        id:{
            type:DataTypes.UUID,
            primaryKey:true,
            defaultValue:DataTypes.UUIDV4
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        email: { 
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
                validate: {isEmail: true},
            },
        
        department_id:{
            type:DataTypes.UUID,
            allowNull:true,// Manager might not be assigned to department initially
        },
        created_at:{
            type:DataTypes.DATE,
            allowNull:false,
            defaultValue:DataTypes.NOW,
        },
    },
    {
        tableName: 'managers',
        timestamps:false,
    });
    return Manager;
}


const ManagerPromise = defineManager().catch((error) => {
    console.error('Failed to define Manager model:', error);
    throw error;
});

export { ManagerPromise as Manager};