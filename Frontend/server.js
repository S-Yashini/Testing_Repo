import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const jsonFilePath = path.join(__dirname, 'src', 'data', 'sdsRecords.json');

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint to save SDS records
app.post('/api/save-sds-records', (req, res) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid records data' });
    }

    // Write to JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(records, null, 2), 'utf8');
    
    console.log(`Successfully saved ${records.length} records to ${jsonFilePath}`);
    res.json({ success: true, message: `Saved ${records.length} records successfully` });
  } catch (error) {
    console.error('Error saving records:', error);
    res.status(500).json({ error: 'Failed to save records', details: error.message });
  }
});

// Endpoint to get current SDS records
app.get('/api/sds-records', (req, res) => {
  try {
    const records = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    res.json(records);
  } catch (error) {
    console.error('Error reading records:', error);
    res.status(500).json({ error: 'Failed to read records', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SDS records file: ${jsonFilePath}`);
});

