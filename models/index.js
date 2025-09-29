
import { sequelize as sequelizePromise } from '../db/db.js';
import { Employee as EmployeePromise } from './employee.js';
import { Department as DepartmentPromise } from './department.js';
import { Role as RolePromise } from './role.js';
import { Salary as SalaryPromise } from './salary.js';
import { Manager as ManagerPromise } from './manager.js';

async function initializeModels() {
    const sequelize = await sequelizePromise;
    const Employee = await EmployeePromise;
    const Department = await DepartmentPromise;
    const Role = await RolePromise;
    const Salary = await SalaryPromise;
    const Manager = await ManagerPromise;


//DEFINE ASSOCIATIONS

//employee belongs to department
Employee.belongsTo(Department,{foreignKey:'department_id',as:'department'});
Department.hasMany(Employee,{foreignKey:'department_id',as:'employees'});

//Department belongs to Manager
Department.belongsTo(Manager,{foreignKey:'manager_id',as:'manager'});
Manager.hasMany(Department,{foreignKey:'manager_id', as: 'managedDepartments'});


//Manager belongs to Department(option if manager is assigned to department)
Manager.belongsTo(Department,{
    foreignKey:'department_id', as:'assignedDepartment'
});


//employee belongs to role
Employee.belongsTo(Role,{
    foreignKey:'role_id', as:'role'
});
Role.hasMany(Employee,{
    foreignKey:'role_id', as:'employees'
});


//Employee has many salaries
Employee.hasMany(Salary,{foreignKey:'employee_id', as:'salaries'});
Salary.belongsTo(Employee,{foreignKey:'employee_id',as:'employee'})



// Sync models with the database
await sequelize.sync({ alter: true });
    console.log('Models synchronized with the database.');


return  {sequelize, Employee, Department, Role, Salary,Manager};
}

const modelsPromise = initializeModels();

export { modelsPromise };