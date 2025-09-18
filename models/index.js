
import { sequelize as sequelizePromise } from '../db/db.js';
import { Employee as EmployeePromise } from './employee.js';
import { Department as DepartmentPromise } from './department.js';
import { Role as RolePromise } from './role.js';
import { Salary as SalaryPromise } from './salary.js';


async function initializeModels() {
    const sequelize = await sequelizePromise;
    const Employee = await EmployeePromise;
    const Department = await DepartmentPromise;
    const Role = await RolePromise;
    const Salary = await SalaryPromise;


//DEFINE ASSOCIATIONS
//employee belongs to department
Employee.belongsTo(Department,{foreignKey:'department_id',as:'department'});
Department.hasMany(Employee,{foreignKey:'department_id',as:'employees'});



//DEPARTMENT HAS ONE MANAGER(EMPLOYEE)
Department.belongsTo(Employee,{foreignKey:'manager_id', as:'manager'});
Employee.hasOne(Department,{foreignKey:'manager_id', as:'managedDepartment'});

//EMPLOYEE BELONGS TO ROLE
Employee.belongsTo(Role, { foreignKey: "role_id", as: "role" });
Role.hasMany(Employee, { foreignKey: "role_id", as: "employees" });

//Employees has many salaries
Employee.hasMany(Salary, { foreignKey: "employee_id", as: "salaries" });
Salary.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });


// Sync models with the database
await sequelize.sync({ alter: true });
    console.log('Models synchronized with the database.');


return  {sequelize, Employee, Department, Role, Salary};
}

const modelsPromise = initializeModels();

export { modelsPromise };