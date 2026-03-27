const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonFilePath = path.join(__dirname, 'src', 'data', 'sdsRecords.json');

// This script can be called with updated records data
// Usage: node sync-sds-records.js <path-to-updated-json>
// Or it will read from a temp file created by the frontend

const syncRecords = (updatedRecords) => {
  try {
    // Write back to file
    fs.writeFileSync(jsonFilePath, JSON.stringify(updatedRecords, null, 2), 'utf8');
    console.log(`Successfully synced ${updatedRecords.length} records to ${jsonFilePath}`);
    return true;
  } catch (error) {
    console.error('Error syncing records:', error);
    return false;
  }
};

// If called with command line argument (path to updated JSON)
if (process.argv.length > 2) {
  const updatedFilePath = process.argv[2];
  try {
    const updatedRecords = JSON.parse(fs.readFileSync(updatedFilePath, 'utf8'));
    syncRecords(updatedRecords);
  } catch (error) {
    console.error('Error reading updated file:', error);
    process.exit(1);
  }
} else {
  // Read current file and display info
  try {
    const currentRecords = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log(`Current file has ${currentRecords.length} records`);
    console.log('Usage: node sync-sds-records.js <path-to-updated-json>');
  } catch (error) {
    console.error('Error reading current file:', error);
    process.exit(1);
  }
}

module.exports = { syncRecords };

