const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors()); 

app.get('/api/faculties', async (req, res) => {
  try {
    const response = await axios.get(
      'https://schedule.ulbsibiu.ro/api/faculties',
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la ULBS API' });
  }
});

app.get('/api/specializations/:facultyId', async (req, res) => {
  try {
    const { facultyId } = req.params;

    const response = await axios.get(
      `https://schedule.ulbsibiu.ro/api/faculties/${facultyId}/study-formations?level=3`,
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la specializari' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});