import express from "express";
//import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import { Sequelize } from "sequelize";
import connectSessionSequelize from "connect-session-sequelize";
import { modelsPromise } from "./models/index.js";
import LocalStrategy from "passport-local";



const SequelizeStore = connectSessionSequelize(session.Store);

// authentication packages

// CREATE SESSION STORE THAT SAVE SESSIONS TO DB
//THIS SESSION STORE WILL LET US SAVE OUR SESSION INSIDE DB BY UTILIZING SEQUELIZE
//IT WILL HANDLE SESSION KEY EXPIRATION AUTOMATICALLY
//sesion store

//await model promise to get sequelize models
const { sequelize,Employee, Role, Department, Salary, Manager } = await modelsPromise;

const app = express();

//middleware
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
});

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const sessionStore = new SequelizeStore({
  db: sequelize,
}); 

//INITIALIZE DB
async function initializeDatabase() {
  try {
    //test connection to the database

    await sequelize.authenticate();
    console.log("Neon PostgreSQL connection established successfully");

    //sync the models with the database
    await sequelize.sync({ alter: true });
    console.log("database synchronized successfully.");
    sessionStore.sync();
  } catch (error) {
    console.error(error);
  }
}
await initializeDatabase();

// CORS configuration
const allowedOrigins = ['http://localhost:3000',
  'http://localhost:5173', process.env.FRONTEND_URL];
//This will allow your frontedn to make request to the backend

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// app.use(cors({ origin: '*' ,
//   credentials:true,
// }))

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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", //allow cookies to be sent with cross-site request
      httpOnly: true, // prevent client side js from acessing the cookie
      maxAge: 24 * 60 * 60 * 1000, // set cookie to expire in 5 minutes
    },
  })
);

// app.use((req, res, next) => {
//   console.log("Request Origin", req.headers.origin);
//   next();
// });

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
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await Employee.findOne({ where: { email } });
        if (!user) {
          return done(null, false, {
            message: "Incorrect Email",
          });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "incorrect password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

//authentication middleware(apply to protected route)(re)
const isAuthenticated = (req, res, next) => {
  console.log("Origin:", req.get("Origin")); // Debug line
  console.log("Headers:", req.headers);
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

//API ENDPOINTS

app.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
});

//get /api/employees -list all employees
app.get("/api/employees", isAuthenticated, async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        { model: Department, as: "department" },
        { model: Role, as: "role" },
        { model: Salary, as: "salaries" },
      ],
    });
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees", error);
    res.status(500).json({ message: "internal server error" });
  }
});

//POST /api/employees - Add new employee
app.post("/api/employees", async (req, res) => {
  try {
    const { name, email, password, department_id, role_id, manager_id } =
      req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await Employee.create({
      name,
      email,
      password: hashedPassword,
      department_id,
      role_id,
    });
    res.status(201).json(employee);
  } catch (error) {
    console.error("error creating employee", error);
    res.status(500).json({ message: "internal server error" });
  }
});

//PUT /api/employees/:id - Update employee details
app.put("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, department_id, role_id } = req.body;
    const employee = await Employee.findByPk(id);
    if (!employee) {
     return res.status(404).json({ message: "Employee not found" });
    }
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (department_id) updates.department_id = department_id;
    if (role_id) updates.role_id = role_id;
    //if (manager_id) updates.manager_id = manager_id;
    await employee.update(updates);
    res.json(employee);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "internal server Error" });
  }
});

//GET /api/departments - List departments

app.get("/api/departments", async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        { model: Manager, as: "manager" },
        { model: Employee, as: "employees" },
      ],
    });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//POST /api/departments - Create department
app.post("/api/departments", async (req, res) => {
  try {
    const { name, description, manager_id } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Department name required" });
    }

    const department = await Department.create({
      name,
      description,
      manager_id,
    });
    res.status(201).json(department);
  } catch (error) {
    console.error("Error creating Department", error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

//GET /api/employees/department/:deptId - Filter by department

app.get("/api/employees/department/:deptId", async (req, res) => {
  try {
    const { deptId } = req.params;
    const employees = await Employee.findAll({
      where: { department_id: deptId },
      include: [
        { model: Department, as: "department" },
        { model: Role, as: "role" },
        { model: Salary, as: "salaries" },
      ],
    });
    if (employees.length === 0) {
      return res
        .status(404)
        .json({ message: "No employees found in this department" });
    }
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees for by department", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//PUT /api/employees/:id/salary - Update salary

app.put("/api/employees/:id/salary", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, effective_date } = req.body;
    if (!amount || !effective_date) {
      return res
        .status(400)
        .json({ message: "Amount and effective date are required" });
    }
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const salary = await Salary.create({
      employee_id: id,
      amount,
      effective_date,
    });
    res.status(201).json(salary);
  } catch (error) {
    console.error("Error updating Employee Salary", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//PUT /api/employees/:id/role - Update role
app.put("/api/employees/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    if (!role_id) {
      return res.status(400).json({ message: "Role Id required" });
    }
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    await employee.update({ role_id });
    res.json(employee);
  } catch (error) {
    console.error("Error updating role", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(9001, (error) => {
  if (error) {
    console.log("Creation of server failed:", error);
    return;
  }
  console.log("server is listening on port 9001");
});

 






























































