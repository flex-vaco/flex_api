const userACL = require('../lib/userACL.js');

const phi_data_agents = async (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    console.log("User IP address: ", req.ip)
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const userQuery = req?.query?.userQuery;
  const ai_session_ID = req.user?.user_id+"_"+req.user?.role;
    try {
        const apiUrl = "http://13.57.185.244:5603/resume_query?query="+userQuery+"&user_id="+ai_session_ID;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data from GenAI API' });
    }
};

module.exports = { phi_data_agents }