const sql = require("../lib/db.js");
const workRequestTable = "work_request";
const workRequestCapabilityAreasTable = "work_request_capability_areas";
const workRequestResourcesTable = "work_request_resources";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  let query = `
    SELECT wr.*, 
           sl.name as service_line_name,
           lb.name as line_of_business_name,
           pd.project_name,
           pd.project_location,
           u.first_name, u.last_name,
           GROUP_CONCAT(DISTINCT ca.name) as capability_areas,
           GROUP_CONCAT(DISTINCT CONCAT(ed.first_name, ' ', ed.last_name)) as assigned_resources
    FROM ${workRequestTable} wr
    LEFT JOIN service_line sl ON wr.service_line_id = sl.id
    LEFT JOIN line_of_business lb ON wr.line_of_business_id = lb.id
    LEFT JOIN project_details pd ON wr.project_id = pd.project_id
    LEFT JOIN users u ON wr.submitted_by = u.user_id
    LEFT JOIN ${workRequestCapabilityAreasTable} wrca ON wr.id = wrca.work_request_id
    LEFT JOIN capability_area ca ON wrca.capability_area_id = ca.id
    LEFT JOIN ${workRequestResourcesTable} wrr ON wr.id = wrr.work_request_id
    LEFT JOIN employee_details ed ON wrr.employee_id = ed.emp_id
    GROUP BY wr.id
    ORDER BY wr.created_at DESC
  `;
  
  // Add line of business filter for non-administrator users
  let whereConditions = [];
  if (req.user.role !== 'administrator') {
    whereConditions.push(`wr.line_of_business_id = ${req.user.line_of_business_id}`);
  }
  
  if (whereConditions.length > 0) {
    query = query.replace('GROUP BY wr.id', `WHERE ${whereConditions.join(' AND ')} GROUP BY wr.id`);
  }
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting work requests. ${err}`);
    }
    return res.status(200).send({workRequests: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const workRequestId = req.params.id;
  if (workRequestId) {
    let query = `
      SELECT wr.*, 
             sl.name as service_line_name,
             lb.name as line_of_business_name,
             pd.project_name,
             pd.project_location,
             u.first_name, u.last_name
      FROM ${workRequestTable} wr
      LEFT JOIN service_line sl ON wr.service_line_id = sl.id
      LEFT JOIN line_of_business lb ON wr.line_of_business_id = lb.id
      LEFT JOIN project_details pd ON wr.project_id = pd.project_id
      LEFT JOIN users u ON wr.submitted_by = u.user_id
      WHERE wr.id = ?
    `;
    
    let params = [workRequestId];
    
    // Add line of business filter for non-administrator users
    if (req.user.role !== 'administrator') {
      query += ` AND wr.line_of_business_id = ?`;
      params.push(req.user.line_of_business_id);
    }
    
          sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Work Request. ${err}`);
      }
      
      if (rows.length > 0) {
        // Get capability areas for this work request
        const capabilityAreasQuery = `
          SELECT ca.* 
          FROM ${workRequestCapabilityAreasTable} wrca
          LEFT JOIN capability_area ca ON wrca.capability_area_id = ca.id
          WHERE wrca.work_request_id = ?
        `;
        
        sql.query(capabilityAreasQuery, [workRequestId], (err, capabilityAreas) => {
          if (err) {
            console.log("error: ", err);
            return res.status(500).send(`There was a problem getting capability areas. ${err}`);
          }
          
          // Get assigned resources for this work request
          const resourcesQuery = `
            SELECT ed.*, wrr.allocation_percentage
            FROM ${workRequestResourcesTable} wrr
            LEFT JOIN employee_details ed ON wrr.employee_id = ed.emp_id
            WHERE wrr.work_request_id = ?
          `;
          
          sql.query(resourcesQuery, [workRequestId], (err, resources) => {
            if (err) {
              console.log("error: ", err);
              return res.status(500).send(`There was a problem getting resources. ${err}`);
            }
            
            const workRequest = rows[0];
            workRequest.capability_areas = capabilityAreas;
            workRequest.resources = resources;
            
            return res.status(200).send({workRequest: workRequest, user: req.user});
          });
        });
      } else {
        return res.status(404).send({error: true, message: "Work Request not found"});
      }
    });
  } else {
    return res.status(500).send("Work Request ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasWorkRequestCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  console.log("workRequestDatas: ", req.body);
  // Set line of business based on user role
  let lineOfBusinessId = req.body.line_of_business_id;
  if (req.user.role !== 'administrator') {
    lineOfBusinessId = req.user.line_of_business_id;
  }
  
  const workRequestData = {
    title: req.body.title,
    service_line_id: req.body.service_line_id,
    line_of_business_id: lineOfBusinessId,
    project_id: req.body.project_id,
    duration_from: req.body.duration_from,
    duration_to: req.body.duration_to,
    hours_per_week: req.body.hours_per_week,
    notes: req.body.notes || '',
    status: 'draft'
  };
  workRequestData.submitted_by = req.user.user_id;
  
  const insertQuery = `INSERT INTO ${workRequestTable} SET ?`;
  sql.query(insertQuery, [workRequestData], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Work Request. ${err}`);
    } else {
      const workRequestId = success.insertId;
      
      // Insert capability areas if provided
      if (req.body.capability_area_ids && req.body.capability_area_ids.length > 0) {
        const capabilityAreasData = req.body.capability_area_ids.map(caId => ({
          work_request_id: workRequestId,
          capability_area_id: caId
        }));
        
        const capabilityAreasQuery = `INSERT INTO ${workRequestCapabilityAreasTable} SET ?`;
        capabilityAreasData.forEach(data => {
          sql.query(capabilityAreasQuery, [data], (err) => {
            if (err) console.log("Error inserting capability area:", err);
          });
        });
      }
      
      // Insert resources if provided
      if (req.body.resource_ids && req.body.resource_ids.length > 0) {
        const resourcesData = req.body.resource_ids.map(empId => ({
          work_request_id: workRequestId,
          employee_id: empId
        }));
        
        const resourcesQuery = `INSERT INTO ${workRequestResourcesTable} SET ?`;
        resourcesData.forEach(data => {
          sql.query(resourcesQuery, [data], (err) => {
            if (err) console.log("Error inserting resource:", err);
          });
        });
      }
      
      workRequestData.id = workRequestId;
      const response = {newWorkRequest: workRequestData, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasWorkRequestUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Work Request ID is Required');
  }
  
  const updatedWorkRequest = req.body;
  
  // Parse JSON strings from FormData
  let capabilityAreaIds = [];
  let resourceIds = [];
  
  if (updatedWorkRequest.capability_area_ids) {
    try {
      capabilityAreaIds = JSON.parse(updatedWorkRequest.capability_area_ids);
    } catch (e) {
      console.log("Error parsing capability_area_ids:", e);
    }
  }
  
  if (updatedWorkRequest.resource_ids) {
    try {
      resourceIds = JSON.parse(updatedWorkRequest.resource_ids);
    } catch (e) {
      console.log("Error parsing resource_ids:", e);
    }
  }
  console.log("updatedWorkRequest: ", updatedWorkRequest);
  console.log("Parsed capabilityAreaIds:", capabilityAreaIds);
  console.log("Parsed resourceIds:", resourceIds);
  
  // Set line of business based on user role
  let lineOfBusinessId = updatedWorkRequest.line_of_business_id;
  if (req.user.role !== 'administrator') {
    lineOfBusinessId = req.user.line_of_business_id;
  }
  
  // Only update fields that exist in the work_request table
  const workRequestData = {
    title: updatedWorkRequest.title,
    service_line_id: updatedWorkRequest.service_line_id,
    line_of_business_id: lineOfBusinessId,
    project_id: updatedWorkRequest.project_id,
    duration_from: updatedWorkRequest.duration_from,
    duration_to: updatedWorkRequest.duration_to,
    hours_per_week: updatedWorkRequest.hours_per_week,
    notes: updatedWorkRequest.notes
  };
  
  const updateQuery = `UPDATE ${workRequestTable} SET ? WHERE id = ?`;
  sql.query(updateQuery,[workRequestData, id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${workRequestTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${workRequestTable} UPDATED:` , success)
        
        // Update capability areas if provided
        if (capabilityAreaIds && capabilityAreaIds.length > 0) {
          // Delete existing capability areas
          sql.query(`DELETE FROM ${workRequestCapabilityAreasTable} WHERE work_request_id = ?`, [id], (err) => {
            if (err) console.log("Error deleting existing capability areas:", err);
            
            // Insert new capability areas
            const capabilityAreasData = capabilityAreaIds.map(caId => ({
              work_request_id: id,
              capability_area_id: caId
            }));
            
            const capabilityAreasQuery = `INSERT INTO ${workRequestCapabilityAreasTable} SET ?`;
            capabilityAreasData.forEach(data => {
              sql.query(capabilityAreasQuery, [data], (err) => {
                if (err) console.log("Error updating capability area:", err);
              });
            });
          });
        }
        
        // Update resources if provided
        if (resourceIds && resourceIds.length > 0) {
          // Delete existing resources
          sql.query(`DELETE FROM ${workRequestResourcesTable} WHERE work_request_id = ?`, [id], (err) => {
            if (err) console.log("Error deleting existing resources:", err);
            
            // Insert new resources
            const resourcesData = resourceIds.map(empId => ({
              work_request_id: id,
              employee_id: empId
            }));
            
            console.log("Inserting resources data:", resourcesData);
            
            const resourcesQuery = `INSERT INTO ${workRequestResourcesTable} SET ?`;
            resourcesData.forEach(data => {
              sql.query(resourcesQuery, [data], (err) => {
                if (err) console.log("Error updating resource:", err);
                else console.log("Resource inserted successfully:", data);
              });
            });
          });
        }
        
        updatedWorkRequest.id = parseInt(id);
        const response = {updatedWorkRequest, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Work Request ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasWorkRequestDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Work Request ID is Required');
  }

  const deleteQuery = `DELETE FROM ${workRequestTable} WHERE id = ?`;
  sql.query(deleteQuery,[id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${workRequestTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${workRequestTable} DELETED:` , success)
        res.status(200).send({msg: `Deleted row from ${workRequestTable} with ID: ${id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with Work Request ID: ${id}`);
      }
    }
  });
};

const getResourcesByCapabilityAreas = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { capabilityAreaIds } = req.body;
  console.log("capabilityAreaIds: ", capabilityAreaIds);
  if (!capabilityAreaIds || capabilityAreaIds.length === 0) {
    return res.status(400).send({error: true, message: "Capability area IDs are required"});
  }
  
  // First get the capability area names
  const capabilityAreaQuery = `SELECT id, name FROM capability_area WHERE id IN (${capabilityAreaIds.map(() => '?').join(',')})`;
  sql.query(capabilityAreaQuery, capabilityAreaIds, (err, capabilityAreas) => {
    if (err) {
      console.log("Error fetching capability areas:", err);
      return res.status(500).send({error: true, message: 'Error fetching capability areas'});
    }

    if (capabilityAreas.length === 0) {
      return res.send({error: false, resources: []});
    }

    const capabilityAreaNames = capabilityAreas.map(ca => ca.name);
    
    
    const capabilityConditions = capabilityAreaNames.map(name => 
      `(ed.primary_skills LIKE ? OR ed.secondary_skills LIKE ?)`
    ).join(' OR ');
    
    
    let whereConditions = [];
    if (capabilityConditions) {
      whereConditions.push(`(${capabilityConditions})`);
    }

    if (req.user.role !== 'administrator') {
      whereConditions.push(`ed.line_of_business_id = ${req.user.line_of_business_id}`);
    }

    const query = `
      SELECT DISTINCT ed.* 
      FROM employee_details ed
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ed.first_name, ed.last_name
    `;

    const queryParams = capabilityAreaNames.reduce((acc, name) => {
      acc.push(`%${name}%`, `%${name}%`);
      return acc;
    }, []);

    sql.query(query, queryParams, (err, results) => {
      console.log("results: ", queryParams);
      if (err) {
        console.log("Error fetching resources by capability areas:", err);
        return res.status(500).send({error: true, message: 'Error fetching resources'});
      }
      
      res.send({error: false, resources: results});
    });
  });
};

const getCapabilityAreasByLineOfBusiness = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const lineOfBusinessId = req.params.lineOfBusinessId;
  if (!lineOfBusinessId) {
    return res.status(400).send({error: true, message: "Line of Business ID is required"});
  }
  
  const query = `
    SELECT ca.*, sl.name as service_line_name
    FROM capability_area ca
    LEFT JOIN service_line sl ON ca.service_line_id = sl.id
    WHERE ca.line_of_business_id = ?
    ORDER BY ca.name
  `;
  
  sql.query(query, [lineOfBusinessId], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting capability areas for line of business. ${err}`);
    }
    return res.status(200).send({capabilityAreas: rows, user: req.user});
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  getResourcesByCapabilityAreas,
  getCapabilityAreasByLineOfBusiness
} 