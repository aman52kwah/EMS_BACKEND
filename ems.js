import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import { Sequelize } from "sequelize";
import connectSessionSequelize from "connect-session-sequelize";

import { modelsPromise } from './models/index.js'

const SequelizeStore = connectSessionSequelize(session.Store);





// authentication packages
import LocalStrategy from "passport-local";


// CREATE SESSION STORE THAT SAVE SESSIONS TO DB
//THIS SESSION STORE WILL LET US SAVE OUR SESSION INSIDE DB BY UTILIZING SEQUELIZE
//IT WILL HANDLE SESSION KEY EXPIRATION AUTOMATICALLY





    async function startApp(){
      //await model promise to get sequelize models
      const {sequelize,Employee} =await modelsPromise;

      const app = express();

      //middleware
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
});

  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  //sesion store
const sessionStore = new SequelizeStore({
        db: sequelize,
    });


    //INITIALIZE DB
async function initializeDatabase() {
  try {
    //test connection to the database

    await sequelize.authenticate();
    console.log("Neon postgresSQL connection established sucessfully");

    //sync the models with the database
    await sequelize.sync({ alter: true });
    console.log("database synchronized sucesfully.");
    sessionStore.sync();
  } catch (error) {
    console.error(error);
  }
}
 await initializeDatabase();

 // CORS configuration
//This will allow your frontedn to make request to the backend

app.use(
  cors({
    origin:'*',
    credentials: true,
  })
);

//middleware for session
    app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET_SESSION || "fallbacksecret", //used to sign session cookies
    resave: false, // resave session if it is not modified
    saveUninitialized: false, // dont save unitialized session
    store: sessionStore, // use the session store created
    cookie: {
      secure: process.env.NODE_ENV === "production", //set to true if using https
      sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax"), //allow cookies to be sent with cross-site request
      httpOnly: true, // prevent client side js from acessing the cookie
      maxAge: 24 * 60 * 60 * 1000, // set cookie to expire in 5 minutes
    },
  })
);

    app.use((req, res, next) => {
  console.log("Request Origin", req.headers.origin);
  next();
});
app.use(jsonParser);
app.use(urlencodedParser);

    //PASSPORTJS CONFIG
app.use(passport.initialize()); //initialize passport
app.use(passport.session()); //use passport session

//serialization: what data you want ot store inside youre session
//this will only run when  a user logs in - we only store the user ID in session

passport.serializeUser((user, done) => {
  done(null, user.id);
});

//deserialize
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Employee.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


    //local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await Employee.findOne({ where: { username } });
      if (!user) {
        return done(null, false, {
          message: "Incorrect Username",
        });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if(!isValidPassword){
        return done (null,false,{message: 'Incorrect password'});
      }
      return done(null,user);
    } catch (error) {
        return done(error);
    }
  })
);

  app.listen("2030",(error) => {
    if (error) {
        console.log("creation of server failed:",error);
        return;
    }
    console.log("server is listening on port 2030");
});
    }
    startApp().catch((error) => {
    console.error('Failed to start the application:', error);
});


















































