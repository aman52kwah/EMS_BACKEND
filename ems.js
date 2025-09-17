import express from "express";
const app = express();
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import passpport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import { DataTypes,Sequelize } from "sequelize";
import connectSessionSquelize from "connect-session-sequelize";
const SequelizeStore = connectSessionSquelize(session.Store);

//middleware
const jsonParser = bodyParser.json();
const urlencodedParser =bodyParser.urlencoded({
    extended:false,
});


// authentication packages
import LocalStrategy from "passport-local";


const sequelize = new Sequelize(process.env.DATABASE_URL,{
    dialect:'postgres',
    dialectOptions:{
        ssl:{
            require:true,
            rejectUnauthorized:false //this i important for self-signed certificates
        },
    },
});
console.log("DATABASE_URL:", process.env.DATABASE_URL);

/// CREATE  MODELS



///MODEL RELATIONSHIPS





// CREATE SESSION STORE THAT SAVE SESSIONS TO DB
//THIS SESSION STORE WILL LET US SAVE OUR SESSION INSIDE DB BY UTILIZING SEQUELIZE
//IT WILL HANDLE SESSION KEY EXPIRATION AUTOMATICALLY
const sessionStore = new SequelizeStore({
    db:sequelize,
});



//INITIALIZE DB
async function initializeDatabase(){
try {
    //test connection to the database

    await sequelize.authenticate();
    console.log("neon postgresSQL connection established sucessfully");

    //sync the models with the database
    await sequelize.sync({alter:true});
    console.log("database synchronized sucesfully.");
    sessionStore.sync();
} catch (error) {
    console.error(error);
}
    
}
initializeDatabase();



// CORS configuration
//This will allow your frontedn to make request to the backend

//app.use();


//middleware for session
app.use(express.json());

app.use(
    session({
        secret:process.env.SECRET_SESSION || 'fallbacksecret', //used to sign session cookies
        resave:false, // resave session if it is not modified
        saveUninitialized:false, // dont save unitialized session
        store:sessionStore, // use the session store created
        cookie:{
            secure:process.env.NODE_ENV === "production", //set to true if using https
            sameSite:process.env.NODE_ENV = 'production' ? 'none' : 'lax', //allow cookies to be sent with cross-site request
            httpOnly:true, // prevent client side js from acessing the cookie
            maxAge: 24 * 60 * 60 * 100, // set cookie to expire in 5 minutes
        },
    })
);

app.use((req,res,next)=>{
    console.log('Request Origin', req.headers.origin);
    next();
});
app.use(jsonParser);
app.use(urlencodedParser);

//PASSPORTJS CONFIG
app.use(passpport.initialize());  //initialize passport
app.use(passpport.session()); //use passport session


//serialization: what data you want ot store inside youre session
//this will only run when  a user logs in - we only store the user ID in session











































app.listen("2030",(error) => {
    if (error) {
        console.log("createion of server failed:",error);
        return;
    }
    console.log("server is listening on port 5000");
});