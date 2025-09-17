
const sequelize = require('../db');
const Employee = require('./employee');
const Department = require('./department');
const Role = require('./role');
const Salary = require('./salary');


//DEFINE ASSOCIATIONS
//employee belongs to department
Employee.belongsTo(Department,{foreignKey:'department_id',as:'department'});
Department.hasMany(Employee,{foreignKey:'department_id',as:'employees'});


//DEPARTMENT HAS ONE MANAGER(EMPLOYEE)
Department.belongsTo(Employee,{foreignKey:'manager_id', as:'manager'});
Employee.hasOne(Department,{foreignKey:'manager_id', as:'managedDepartment'});

//EMPLOYEE BELONGS TO ROLE