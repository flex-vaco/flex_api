// const path = require('path');
const userACL = require('../lib/userACL.js');
// const empProjAlloc = "employee_project_allocations";

const phi_data_agents = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    console.log("User Details: ", req.user)
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  // *********** *********** *********** *********** *********** *********** ***********
  // IMPORTANT TBD - Move this route to application and use proper userID of a logged in user 
  // *********** *********** *********** *********** *********** *********** ***********
  const userQuery = req.query.userQuery
//   const userID = "raj_for_session_id" //need to change this
  console.log("Req query... ", userQuery)
  return res.status(200).send({msg: "success", user: req.user, userQuery});
    // try {
    //     const apiUrl = "http://13.57.185.244:5603/resume_query?query="+userQuery+"&user_id="+userID; // Gen AI API endpoint
    //     const response = await fetch(apiUrl);

    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }

    //     const data = await response.json();
    //     res.json(data); // Send the fetched data back to the client
    // } catch (error) {
    //     console.error('Error fetching data:', error);
    //     res.status(500).json({ error: 'Failed to fetch data from GenAI API' });
    // }
};

// const findAll = (req, res) => { // filters by name if params are given
//   if (!userACL.hasEmployeeReadAccess(req.user.role)) {
//     const msg = `User role '${req.user.role}' does not have privileges on this action`;
//     return res.status(404).send({error: true, message: msg});
//   }

//   const managerEmail = req.query?.manager_email;
 
//   let query =`SELECT * FROM ${empTable}`;
//   if (managerEmail) {
//     query += ` WHERE manager_email = '${managerEmail}'`;
//   }
//   sql.query(query, (err, rows) => {
//     if (err) {
//       console.log("error: ", err);
//       return res.status(500).send(`There was a problem getting employees. ${err}`);
//     }
//     return res.status(200).send({employees: rows, user: req.user});
//   });
// };

module.exports = { phi_data_agents }