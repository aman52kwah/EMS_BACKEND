import express from "express";
import cors from "cors";
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
const { sequelize, Employee, Role, Department, Salary, Manager } =
  await modelsPromise;

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
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];
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

//USER LOGIN
app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
});

//USER LOGOUT
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    //pasport.js method to clear session

    if (err) {
      return res
        .status(500)
        .json({ message: "Error logging out", isSuccessful: false });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "logout successful", isSuccessful: true });
  });
});

//GET CURRENT USER INFO
// thos route tells the frontend if a user is currently logged in
app.get("/auth/me", (req, res) => {
  if (isAuthenticated()) {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        provider: req.user.provider,
      },
    });
  } else {
    res.status(401).json({ message: "not authenticated" });
  }
});

// app.use((req, res, next) => {
//   console.log("Session:", req.session);
//   console.log("User:", req.user);
//   next();
// });

//==========API END POINTS FOR ALL OPERATIONS==================
//==============================================================================================
// CRUD FOR EMPLOYEES
//get /api/employees -list all employees
app.get("/api/employees", isAuthenticated, async (req, res) => {
  try {
    const employees = await Employee.findAll({
      // include: [
      //   { model: Department, as: "department" },
      //   { model: Role, as: "role" },
      //   { model: Salary, as: "salaries" },
      // ],
    });
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees", error);
    res.status(500).json({ message: "internal server error" });
  }
});

//find a specific employee by Id
app.get("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findOne({
      where: {
        id,
        userId: req.employee.id,
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
        isSuccessful: false,
      });
    }
    return res.status(200).json({
      message: "Employee Successfully Retrieved",
      isSuccessful: true,
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching Employee",
      error: error.message,
    });
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

//PUT /api/employees/department/:id. update employee department
app.put("/api/employees/department/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id } = res.body;

    //validate input
    if (!department_id) {
      return res.status(404).json({ message: "Department ID required" });
    }

    //find employee by id
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Validate that the department exists
    const department = await Department.findByPk(department_id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Update employee's department_id only if it has changed
    if (employee.department_id !== department_id) {
      await employee.update({ department_id });
    }
    //return the updated employee
    res.status(200).json(employee);
  } catch (error) {
    console.error("Error updating employee's department", error);
    sequelize.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    //delete emploee
    const deletedCount = await Employee.destroy({
      where: {
        id,
        userId: req.id,
      },
    });

    // if no employee deleted, either employee doesnt exist
    if (deletedCount === 0) {
      res.status(404).json({
        message: "Employee not found or you dont have permission ",
      });
      res.status(200).json({
        message: "deleted sucecessfully",
      });
    }
  } catch (error) {
    console.error("Error deleting employeee:", error);
    return res.status(500).json({
      message: "Error deleting employee",
      error: error.message,
    });
  }
});


//==============================================================================================
// CREATE ALL CRUD DEPARTMENTS

//GET /api/departments - List departments
app.get("/api/departments", async (req, res) => {
  try {
    const departments = await Department.findAll();
    console.log(departments);
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

app.get("/api/employees/departments/:deptId", async (req, res) => {
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

// PUT /api/department/:deptId. update department
app.put("/api/department/:deptId", async (req, res) => {
  try {
    const { deptId } = req.params;
    const { name, description } = res.body;

    //Validate input
    if (!name) {
      return res.status(404).json({ message: "Department name required" });
    }

    //find department by ID
    const department = await Department.findByPk(deptId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    //prepare updates
    const updates = {};

    if (name && name !== department.name) {
      updates.name = name;
    }

    if (description && description !== department.description) {
      updates.description = description;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(200).json(department);
    }

    //update department
    await department.update(updates);

    //return updated department
    res.status(200).json(department);
  } catch (error) {
    console.error("Error updating Department", error);
    res.status(500).json("Internal server error");
  }
});

//DELETE /api/departments/:deptId Delete Department

app.delete("/api/department/:deptId", isAuthenticated, async (req, res) => {
  try {
    const { deptId } = req.params;
    //delete delete
    const deletedCount = await Department.destroy({
      where: {
        deptId,
      },
    });

    // if no department deleted, either department doesnt exist
    if (deletedCount === 0) {
      res.status(404).json({
        message: "Department not found or you dont have permission ",
      });
      res.status(200).json({
        message: "deleted sucecessfully",
      });
    }
  } catch (error) {
    console.error("Error deleting department:", error);
    return res.status(500).json({
      message: "Error deleting employee",
      error: error.message,
    });
  }
});

//==============================================================================================

//==============================================================================================
//CREATE CRUD FOR SALARIES

//create salary
app.post("/api/salaries/", async (req, res) => {
  try {
    const { id, amount, effective_date, currency, salary_type } = req.body;
    const salaries = await Salary.create({
      id,
      amount,
      effective_date,
      currency,
      salary_type,
    });
    res.status(201).json(salaries);
  } catch (error) {
    console.error("Error creating Salary", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//GET /api/salaries/ - get all salaries
app.get("/api/salaries", async (req, res) => {
  try {
    const salaries = await Salary.findAll();
    console.log(salaries);
    res.json(salaries);
  } catch (error) {
    console.error("Error Fetching salaries", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//PUT /api/employees/:id/salary - Update Employee salary

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

//==============================================================================================

//==============================================================================================

//CREATE ALL CRUD FOR ROLES

//GET /api/role list all roles
app.get("/api/role", async (req, res) => {
  try {
    const roles = await Role.findAll();
    console.log(roles);
    res.json(roles);
  } catch (error) {
    console.error("Error Fetching Roles:", error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

//POST ADD A NEW ROLE

app.post("/api/role", async (req, res) => {
  try {
    const { id, title, description, level } = req.body;
    const roles = await Role.create({
      id,
      title,
      description,
      level,
    });
    res.status(201).json(roles);
  } catch (error) {
    console.error("Error creating Role", error);
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




//==============================================================================================
// API ENDPOINT FOR MANAGERS

// ADD A MANAGER
app.post("/api/managers/", async (req, res) => {
  try {
    const { id, name, email, department_id } = req.body;
    const managers = await Manager.create({
      id,
      name,
      email,
      department_id,
    });
    res.status(201).json(managers);
  } catch (error) {
    console.error("Error create manager", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// GET /api/managers list all managers
app.get("/api/managers", async (req, res) => {
  try {
    const managers = await Manager.findAll();
    console.log(managers);
    res.json(managers);
  } catch (error) {
    console.error("Error fetching Managers", error);
    res.status(500).json("Internal Server Error");
  }
});

//get /api/managers/:id get a specific manager by id
app.get("/api/managers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const manager= await Manager.findOne({
      where: {
        id,
        userId: req.manager.id,
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
        isSuccessful: false,
      });
    }
    return res.status(200).json({
      message: "Manager Successfully Retrieved",
      isSuccessful: true,
      data: manager,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching Manager",
      error: error.message,
    });
  }
});

//PUT UPDATE A MANAGER
app.put("/api/managers/:id", async (req, res) => {
  try {
    const { id, name, email, department_id } = req.body;

    //Validate input
    if (!name) {
      return res.status(404).json({ message: "Manager name required" });
    }

    //find manager by ID
    const manager = await Manager.findByPk(id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    //prepare updates
    const updates = {};

    if (name && name !== manager.name) {
      updates.name = name;
    }

    if (email && email !== manager.email) {
      updates.email = email;
    }

      if(department_id && department_id !== manager.department_id){
        updates.department_id = department_id
      }
    
    if (Object.keys(updates).length === 0) {
      return res.status(200).json(manager);
    }

    //update department
    await manager.update(updates);

    //return updated department
    res.status(200).json(manager);
  } catch (error) {
    console.error("Error updating Manager", error);
    res.status(500).json("Internal server error");
  }
});

//DELETE MANAGER BY ID
app.delete("/api/managers/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    //delete 
    const deletedCount = await Department.destroy({
      where: {
        id,
      },
    });

    // if no manager is deleted, either department doesnt exist
    if (deletedCount === 0) {
      res.status(404).json({
        message: "Manager not found or you dont have permission ",
      });
      res.status(200).json({
        message: "deleted sucecessfully",
      });
    }
  } catch (error) {
    console.error("Error deleting manager:", error);
    return res.status(500).json({
      message: "Error deleting manager",
      error: error.message,
    });
  }
});

//
//==============================================================================================
app.listen(process.env.PORT, (error) => {
  if (error) {
    console.log("Creation of server failed:", error);
    return;
  }
  console.log("server is listening on port 9001");
});
//==============================================================================================
 






























































