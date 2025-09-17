
import sequelize from '../db/db.js';
import Employee from './employee.js';
import Department from './department.js';
import Role from './role.js';
import Salary from './salary.js';


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

export {sequelize, Employee, Department, Role, Salary};