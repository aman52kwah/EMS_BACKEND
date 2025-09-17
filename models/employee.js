import { DataTypes } from "sequelize";
import sequelize from '../db/db.js';


const Employee = sequelize.define(
    'Employee',
    {
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
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



export default Employee;