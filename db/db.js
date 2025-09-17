import { Sequelize } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
    const sequelize = new Sequelize(process.env.DATABASE_URL,{
        dialect:'postgres',
        dialectOptions:{
            ssl:{
                require:true,
                rejectUnauthorized:false,
            }
        },
    });
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");

        //create new schema
        await sequelize.query("CREATE DATABASE IF NOT EXISTS emsdb");
        console.log("DATABASE created successfully.");
        sequelize.close();
        console.log("connection closed sucessfully");

    } catch (error) {
        console.error("unable to connect to database", error);
    }
}

setupDatabase();

