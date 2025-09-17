import { DataTypes } from "sequelize";
import sequelize from '../db/db.js';


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

export default Role;