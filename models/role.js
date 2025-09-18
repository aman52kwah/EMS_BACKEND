import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineRole() {
    const sequelize = await sequelizePromise;
    if (!sequelize) {
        throw new Error('Sequelize instance is undefined. Check db.js configuration.');
    }

    const Role = sequelize.define(
    'Role', {
        id:{
            type:DataTypes.UUID,
            primaryKey:true,
        },
        title:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true,
        },
        description : {
            type:DataTypes.STRING,
            allowNull:true,
        },
        level:{
            type:DataTypes.STRING, // e.g 'junior','senior', 'lead'
            allowNull:false,
        },
        created_at:{
            type:DataTypes.DATE,
            allowNull:false,
            defaultValue:DataTypes.NOW,
        },
    },
    {
        tableName:'roles',
        timestamps:false,
    }
);
return Role;
}

const RolePromise = defineRole().catch((error) => {
    console.error('Failed to define Role model:', error);
    throw error;
});
export {RolePromise as Role};
