const sql = require("../lib/db.js");
const empTable = "employee_details";
const multer = require('multer');
const path = require('path');
const userACL = require('../lib/userACL.js');
const empProjAlloc = "employee_project_allocations";

const findAll = (req, res) => { 
  if (!userACL.hasEmployeeReadAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const managerEmail = req.query?.manager_email;
  const userRole = req.user.role;
  const userLineOfBusinessId = req.user.line_of_business_id;
 
  let query = `SELECT * FROM ${empTable}`;
  let whereConditions = [];
  
  if (managerEmail) {
    whereConditions.push(`manager_email = '${managerEmail}'`);
  }
  
  if (userRole !== 'administrator' && userLineOfBusinessId) {
    whereConditions.push(`line_of_business_id = ${userLineOfBusinessId}`);
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting employees. ${err}`);
    }
    return res.status(200).send({employees: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const empDetailsId = req.params.emp_id;
  if (empDetailsId) {
    const query = `SELECT * FROM ${empTable} WHERE emp_id = '${empDetailsId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      return res.status(200).send({employees: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Employee ID required");
  }
};


const search = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
    const empSkills = req.query.skill;
    const empLocation =  req.query.location ?? null;
    const empExperience = req.query.exp ?? null;
    const empRole = req.query.role ?? null;
    const empAvailability = req.query.availability ?? null;
    const userRole = req.user.role;
    const userLineOfBusinessId = req.user.line_of_business_id;
    
    let query = `SELECT emp.*, 
                  COALESCE(SUM(ea.hours_per_day) * 5, 0) AS alc_per_week
                  FROM ${empTable} emp
                  LEFT JOIN employee_project_allocations ea
                  ON ea.emp_id = emp.emp_id 
                  AND CURDATE() BETWEEN ea.start_date AND ea.end_date     
                  WHERE 1 = 1`;
    
    // Filter by line of business if user is not administrator
    if (userRole !== 'administrator' && userLineOfBusinessId) {
      query += ` AND emp.line_of_business_id = ${userLineOfBusinessId}`;
    }

    if (empLocation) {
      query = query + ` AND emp.office_location_city LIKE '${empLocation}%'`;
    } 

    if (empExperience) {
      query = query + ` AND emp.total_work_experience_years <= ${empExperience}`;
    }                                          

    if (empRole) {
      query = query + ` AND emp.role LIKE '%${empRole}%'`;
    }   

    query = query + ` GROUP BY emp.emp_id`;
    
    if (empAvailability) {
      query = query + ` HAVING (40 - COALESCE(alc_per_week, 0)) >= ${empAvailability}`;
    }

    
    

    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      if (empSkills && rows) {
            let records = rows.filter((row)=>{
                                        let found = false;
                                        empSkills.forEach((empSkill) => {
                                             let primarySkillList = row.primary_skills.split(',');
                                             primarySkillList.filter((skill)=> {
                                                    if (skill.trim().toLowerCase() === empSkill.trim().toLowerCase()) {
                                                      found = true;
                                                      return found;
                                                    }
                                             })
                                        }) 
                                        return found;                                                                      
                                      })
          return res.status(200).send({employees: records, user: req.user});
      }
      return res.status(200).send({employees: rows, user: req.user});
    });
};

const create = (req, res) => {
  if (!userACL.hasEmployeeCreateAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const fileNameSuffix = Date.now();
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if(file.fieldname === "resume"){
        cb(null,'public/uploads/resume');
       }else if(file.fieldname === "profile_picture"){
        cb(null,'public/uploads/profile_picture');
       }
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
    }
  });

  var upload = multer({ storage : storage});
  
  var multipleUpload = upload.fields([{name:'resume'}, {name: 'profile_picture'}])
  
  multipleUpload(req,res,function(err) {
    if(req.files) {
      console.log(req);
      newEmployee = req.body;
      newEmployee['resume'] = req.files['resume'][0]['filename'];
      newEmployee['profile_picture'] = req.files['profile_picture'][0]['filename'];
      // console.log(req.file.filename);
      console.log(newEmployee);
      const insertQuery = `INSERT INTO ${empTable} set ?`;
      sql.query(insertQuery, [newEmployee], (err, succeess) => {
        if (err) {
          console.log("error: ", err);
          res.status(500).send(`Problem while Adding the employee. ${err}`);
        } else {
          newEmployee.emp_id = succeess.insertId;
          const response = {newEmployee, user: req.user};
          res.status(200).send(response);
        }
      });
    }else{
      res.status(500).send(`Problem while Uploading files.`);
    }
  });
  
};

const update = (req, res) => {
  if (!userACL.hasEmployeeUpdateAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }

  const { emp_id } = req.params;
  if (!emp_id) {
    res.status(500).send({ error: true, message:'Employee ID is Required'});
  }
  const fileNameSuffix = Date.now();
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "resume") {
        cb(null, "public/uploads/resume");
      } else if (file.fieldname === "profile_picture") {
        cb(null, 'public/uploads/profile_picture');
      }
    },
    filename: (req, file, cb) => {
      console.log("Insidee STORAGE ", req.body.profile_pic_file_name, req.body.resume_file_name);
      if (file.fieldname === "resume") {
        //Use the exisitng file-name if it has one
        if (req.body.resume_file_name && ![null, 'null'].includes(req.body.resume_file_name)) {
          cb(null, req.body.resume_file_name);
        } else {
          cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
        }
      } else if (file.fieldname === "profile_picture") {
        //Use the exisitng file-name if it has one
        if (req.body.profile_pic_file_name && ![null, 'null'].includes(req.body.profile_pic_file_name)) {
          cb(null, req.body.profile_pic_file_name);
        } else {
          cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
        }
      }
    }
  });

  const upload = multer({ storage: storage });
  const fileUploader = upload.fields([{ name: 'resume' }, { name: 'profile_picture' }]);

  fileUploader(req, res, (err)=> {
    const updatedEmployee = req.body;

    if (req.files?.resume) updatedEmployee['resume'] = req.files.resume[0]['filename'];
    if (req.files?.profile_picture)  updatedEmployee['profile_picture'] = req.files['profile_picture'][0]['filename'];
     
    delete(updatedEmployee.resume_file_name);
    delete(updatedEmployee.profile_pic_file_name);

    const updateQuery = `UPDATE ${empTable} set ? WHERE emp_id = ?`;
    sql.query(updateQuery, [updatedEmployee, emp_id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Updating the ${empTable} with ID: ${emp_id}. ${err}`);
      } else {
        if (success.affectedRows == 1) {
          updatedEmployee.emp_id = parseInt(emp_id);
          const response = { updatedEmployee, user: req.user }
          res.status(200).send(response);
        } else {
          res.status(404).send({error: true, message:`Record not found with Employee Details ID: ${emp_id}`});
        }
      }
    });
  });

};

const erase = (req, res) => {
  if (!userACL.hasEmployeeDeleteAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { emp_id } = req.params;
  if(!emp_id){
    res.status(500).send('Employee ID is Required');
  }
  //const updatedEmployee = req.body;
  const deleteQuery = `DELETE FROM ${empTable} WHERE emp_id = ?`;
  sql.query(deleteQuery,[emp_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${empTable} with ID: ${emp_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${empTable} DELETED:` , succeess)
        //updatedEmployee.emp_id = parseInt(emp_id);
        res.status(200).send({msg:`Deleted row from ${empTable} with ID: ${emp_id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with Employee Details ID: ${emp_id}`);
      }
    }
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  search
}