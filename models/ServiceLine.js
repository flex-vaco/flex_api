const sql = require("../lib/db.js");
const serviceLineTable = "service_line";
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');

const findAll = (req, res) => {
  if (!userACL.hasServiceLineReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  let query = `SELECT sl.*, lb.name as line_of_business_name FROM ${serviceLineTable} sl LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.id`;
  let whereConditions = [];
  
  if (req.user.role !== 'administrator') {
    whereConditions.push(`sl.line_of_business_id = ${req.user.line_of_business_id}`);
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY sl.name`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting service lines. ${err}`);
    }
    return res.status(200).send({serviceLines: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasServiceLineReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const serviceLineId = req.params.id;
  if (serviceLineId) {
    let query = `SELECT sl.*, lb.name as line_of_business_name FROM ${serviceLineTable} sl LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.id WHERE sl.id = ?`;
    let params = [serviceLineId];
    
    if (req.user.role !== 'administrator') {
      query += ` AND sl.line_of_business_id = ?`;
      params.push(req.user.line_of_business_id);
    }
    
    sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Service Line. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Service Line not found or access denied");
      }
      
      return res.status(200).send({serviceLine: rows[0], user: req.user});
    });
  } else {
    return res.status(500).send("Service Line ID required");
  }
};

const findByLineOfBusiness = (req, res) => {
  if (!userACL.hasServiceLineReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const lineOfBusinessId = req.params.lineOfBusinessId;
  if (lineOfBusinessId) {
    const query = `SELECT * FROM ${serviceLineTable} WHERE line_of_business_id = ?`;
    sql.query(query, [lineOfBusinessId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting service lines for line of business. ${err}`);
      }
      return res.status(200).send({serviceLines: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Line of Business ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasServiceLineCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const newServiceLine = req.body;
  
  if (req.user.role !== 'administrator') {
    if (!newServiceLine.line_of_business_id) {
      return res.status(400).send("Line of business is required for non administrator users");
    }
    if (newServiceLine.line_of_business_id != req.user.line_of_business_id) {
      return res.status(403).send("Non administrator users can only create service lines in their own line of business");
    }
  }
  
  const insertQuery = `INSERT INTO ${serviceLineTable} set ?`;
  sql.query(insertQuery, [newServiceLine], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Service Line. ${err}`);
    } else {
      newServiceLine.id = success.insertId;   
      const response = {newServiceLine, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasServiceLineUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Service Line ID is Required');
  }
  const updatedServiceLine = req.body;
  
  if (req.user.role !== 'administrator') {
    const checkQuery = `SELECT line_of_business_id FROM ${serviceLineTable} WHERE id = ?`;
    sql.query(checkQuery, [id], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while checking service line access. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Service Line not found");
      }
      
      if (rows[0].line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users can only update service lines in their own line of business");
      }
      
      if (updatedServiceLine.line_of_business_id && updatedServiceLine.line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users cannot change service line's line of business");
      }
      
      proceedWithUpdate();
    });
  } else {
    proceedWithUpdate();
  }
  
  function proceedWithUpdate() {
    const updateQuery = `UPDATE ${serviceLineTable} set ? WHERE id = ?`;
    sql.query(updateQuery,[updatedServiceLine, id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Updating the ${serviceLineTable} with ID: ${id}. ${err}`);
      } else {
        if (success.affectedRows == 1){
          console.log(`${serviceLineTable} UPDATED:` , success)
          updatedServiceLine.id = parseInt(id);
          const response = {updatedServiceLine, user: req.user}
          res.status(200).send(response);
        } else {
          res.status(404).send(`Record not found with Service Line ID: ${id}`);
        }
      }
    });
  }
};

const erase = (req, res) => {
  if (!userACL.hasServiceLineDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Service Line ID is Required');
  }
  
  if (req.user.role !== 'administrator') {
    const checkQuery = `SELECT line_of_business_id FROM ${serviceLineTable} WHERE id = ?`;
    sql.query(checkQuery, [id], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while checking service line access. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Service Line not found");
      }
      
      if (rows[0].line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users can only delete service lines in their own line of business");
      }
      
      proceedWithDelete();
    });
  } else {
    proceedWithDelete();
  }
  
  function proceedWithDelete() {
    const deleteQuery = `DELETE FROM ${serviceLineTable} WHERE id = ?`;
    sql.query(deleteQuery,[id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Deleting the ${serviceLineTable} with ID: ${id}. ${err}`);
      } else {
        if (success.affectedRows == 1){
          console.log(`${serviceLineTable} DELETED:` , success)
          res.status(200).send({msg: `Deleted row from ${serviceLineTable} with ID: ${id}`, user: req.user});
        } else {
          res.status(404).send(`Record not found with Service Line ID: ${id}`);
        }
      }
    });
  }
};

module.exports = {
  findAll,
  findById,
  findByLineOfBusiness,
  create,
  update,
  erase
} 