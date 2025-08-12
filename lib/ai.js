const { Configuration, OpenAIApi } = require("openai");
const sql = require("../lib/db");
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const db_name = process.env.DB_NAME
console.log("Hitting AI using DB_NAME: ",db_name)
const aiAPI = new OpenAIApi(configuration);
let prompt = null;

const dbDetails = () => {
   
   const query1 = `select concat(table_name, '(', GROUP_CONCAT(COLUMN_NAME SEPARATOR ',\n'), ')') as table_structure FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_schema = '${db_name}'
   GROUP BY table_name`

   const query = `SELECT
   c.TABLE_NAME AS table_name,
   c.COLUMN_NAME AS column_name,
   c.COLUMN_TYPE AS column_type,
   c.COLUMN_KEY AS column_key,
   IFNULL(k.REFERENCED_TABLE_NAME, '') AS referenced_table,
   IFNULL(k.REFERENCED_COLUMN_NAME, '') AS referenced_column
FROM
   INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
   ON c.TABLE_NAME = k.TABLE_NAME AND c.COLUMN_NAME = k.COLUMN_NAME
LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
   ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME
WHERE
   c.TABLE_SCHEMA = '${db_name}'
ORDER BY
   TABLE_NAME, c.ORDINAL_POSITION`;

   sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
    }
      // const dbSchema = rows.reduce((accumulator, currentObject) => {
      //   console.log(currentObject);

      //   return accumulator + currentObject?.table_structure + ',\n';
      // }, '');

      const data = {};
      rows.forEach((row) => {
        const { table_name, column_name, column_type, column_key, referenced_table, referenced_column } = row;

        if (!data[table_name]) {
          data[table_name] = {
            columns: {},
            primary_key: column_key,
            foreign_keys: []
          };
        }

        data[table_name].columns[column_name] = column_type;

        if (referenced_table && referenced_column) {
          data[table_name].foreign_keys.push({
            column: column_name,
            references: {
              table: referenced_table,
              column: referenced_column
            }
          });
        }
      });

      const dbSchema = JSON.stringify(data, null, 2);
      console.log("DB Schema", dbSchema);
      prompt = `These are MySQL database tables and columns. ${dbSchema}
      return ONLY the MySQL query to find : `;
      console.log('AI SQL GENERATOR INITIATED');
      
    });
}

dbDetails();

const getAIGeneratedQuery = async (message) => {

  const response = await aiAPI.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "system", content: prompt + message}],
  });

  return response.data['choices'][0].message?.content;
}

const getSQLAgentResponse = async (userQuery) => {
  if (!userQuery)  return "Query is required to get an answer!"
  try {
      const apiUrl = "http://13.57.185.244:5603/sql_query?query="+userQuery // Gen AI API endpoint
      const response = await fetch(apiUrl);

      if (!response.ok) {
          throw new Error(`GEN AI HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return res.json(data)?.ai_response;
  } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Failed to fetch data from GenAI API' });
  }
}

console.log("AI generated query: ", getAIGeneratedQuery)
module.exports = { getAIGeneratedQuery, getSQLAgentResponse };
