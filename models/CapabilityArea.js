const sql = require("../lib/db.js");
const capabilityAreaTable = "capability_area";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasCapabilityAreaReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  let query =`SELECT ca.*, sl.name as service_line_name FROM ${capabilityAreaTable} ca 
               LEFT JOIN service_line sl ON ca.service_line_id = sl.id`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting capability areas. ${err}`);
    }
    return res.status(200).send({capabilityAreas: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasCapabilityAreaReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const capabilityAreaId = req.params.id;
  if (capabilityAreaId) {
    const query = `SELECT ca.*, sl.name as service_line_name FROM ${capabilityAreaTable} ca 
                   LEFT JOIN service_line sl ON ca.service_line_id = sl.id 
                   WHERE ca.id = '${capabilityAreaId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Capability Area. ${err}`);
      }
      
      return res.status(200).send({capabilityArea: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Capability Area ID required");
  }
};

const findByServiceLine = (req, res) => {
  if (!userACL.hasCapabilityAreaReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const serviceLineId = req.params.serviceLineId;
  if (serviceLineId) {
    const query = `SELECT * FROM ${capabilityAreaTable} WHERE service_line_id = ?`;
    sql.query(query, [serviceLineId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting capability areas for service line. ${err}`);
      }
      return res.status(200).send({capabilityAreas: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Service Line ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasCapabilityAreaCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newCapabilityArea = req.body;
  const insertQuery = `INSERT INTO ${capabilityAreaTable} set ?`;
  sql.query(insertQuery, [newCapabilityArea], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Capability Area. ${err}`);
    } else {
      newCapabilityArea.id = success.insertId;   
      const response = {newCapabilityArea, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasCapabilityAreaUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { id } = req.params;
  if(!id){
    res.status(500).send('Capability Area ID is Required');
  }
  const updatedCapabilityArea = req.body;
  const updateQuery = `UPDATE ${capabilityAreaTable} set ? WHERE id = ?`;
  sql.query(updateQuery,[updatedCapabilityArea, id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${capabilityAreaTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${capabilityAreaTable} UPDATED:` , success)
        updatedCapabilityArea.id = parseInt(id);
        const response = {updatedCapabilityArea, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Capability Area ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasCapabilityAreaDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { id } = req.params;
  if(!id){
    res.status(500).send('Capability Area ID is Required');
  }

  const deleteQuery = `DELETE FROM ${capabilityAreaTable} WHERE id = ?`;
  sql.query(deleteQuery,[id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${capabilityAreaTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${capabilityAreaTable} DELETED:` , success)
        res.status(200).send({msg: `Deleted row from ${capabilityAreaTable} with ID: ${id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with Capability Area ID: ${id}`);
      }
    }
  });
};

module.exports = {
  findAll,
  findById,
  findByServiceLine,
  create,
  update,
  erase
} 