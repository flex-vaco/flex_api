const sql = require("../lib/db.js");
const serviceLineTable = "service_line";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasServiceLineReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  let query =`SELECT * FROM ${serviceLineTable}`;
  
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
    const query = `SELECT * FROM ${serviceLineTable} WHERE id = '${serviceLineId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Service Line. ${err}`);
      }
      
      return res.status(200).send({serviceLine: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Service Line ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasServiceLineCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newServiceLine = req.body;
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
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase
} 