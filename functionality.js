// =============================
// Very Simple Data Cleaner JS
// =============================
// Features:
// 1. Upload a CSV file
// 2. Show a preview (first 10 rows)
// 3. Show simple stats (rows, columns, missing, duplicates)
// 4. Clean data (remove duplicate rows, fill missing numeric values)
// 5. Download cleaned data as a new CSV

// We will only support CSV to keep things simple.

// ------------
// 1. Variables
// ------------

let rawData = null;     // Original data from the uploaded file
let cleanedData = null; // Data after cleaning

// Grab the HTML elements we need
const fileInput = document.getElementById('fileInput');
const cleanBtn = document.getElementById('cleanBtn');
const downloadBtn = document.getElementById('downloadBtn');
const removeDuplicatesCheckbox = document.getElementById('removeDuplicates');
const handleMissingCheckbox = document.getElementById('handleMissing');

// Disable buttons until a file is uploaded
cleanBtn.disabled = true;
downloadBtn.disabled = true;

// --------------------
// 2. Event Listeners
// --------------------

// When a file is chosen, read it
fileInput.addEventListener('change', handleFileUpload);

// When "Clean Data" is clicked
cleanBtn.addEventListener('click', cleanData);

// When "Download" is clicked
downloadBtn.addEventListener('click', downloadCleanedData);

// -----------------------
// 3. Helper: parse CSV
// -----------------------

// Turn CSV text into an array of row objects
// Example:
// Name,Age
// John,20
// -> [ {Name: "John", Age: "20"} ]
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
    }

    return data;
}

// -----------------------------
// 4. Handle file upload
// -----------------------------

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
        alert('Please upload a CSV file (.csv).');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        const content = e.target.result;
        rawData = parseCSV(content);
        cleanedData = JSON.parse(JSON.stringify(rawData)); // start cleanedData as a copy

        if (rawData && rawData.length > 0) {
            updateStatsAndPreview(cleanedData);
            updateDataInfo(file.name, Object.keys(rawData[0]));
            cleanBtn.disabled = false;
            downloadBtn.disabled = true;
        } else {
            alert('The CSV file seems to be empty.');
        }
    };

    reader.readAsText(file);
}

// --------------------------------------
// 5. Update stats (cards) and preview
// --------------------------------------

function updateStatsAndPreview(data) {
    if (!data || data.length === 0) return;

    const rowCount = data.length;
    const columns = Object.keys(data[0]);
    const colCount = columns.length;

    // Count missing values (empty strings)
    let missingCount = 0;
    data.forEach(row => {
        columns.forEach(col => {
            if (row[col] === '' || row[col] === null || row[col] === undefined) {
                missingCount++;
            }
        });
    });

    // Count duplicates based on full row
    const rowStrings = data.map(row => JSON.stringify(row));
    const uniqueRows = new Set(rowStrings).size;
    const dupCount = rowCount - uniqueRows;

    document.getElementById('rowCount').textContent = rowCount;
    document.getElementById('colCount').textContent = colCount;
    document.getElementById('missingCount').textContent = missingCount;
    document.getElementById('dupCount').textContent = dupCount;

    updatePreviewTable(data);
}

// Show first 10 rows in a table
function updatePreviewTable(data) {
    const columns = Object.keys(data[0]);
    let html = '<table><thead><tr>';

    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });

    html += '</tr></thead><tbody>';

    const previewRows = data.slice(0, 10);
    previewRows.forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
            const value = row[col] === '' || row[col] === null || row[col] === undefined
                ? '<em>empty</em>'
                : row[col];
            html += `<td>${value}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';

    document.getElementById('preview').innerHTML = html;
}

// Update the small info box in the sidebar
function updateDataInfo(fileName, columns) {
    const infoBox = document.getElementById('dataInfo');
    infoBox.innerHTML = `
        <p><strong>File loaded:</strong> ${fileName}</p>
        <p><strong>Columns:</strong> ${columns.join(', ')}</p>
    `;
}

// --------------------------
// 6. Clean the data
// --------------------------

function cleanData() {
    if (!rawData) return;

    // Start from original again each time you click Clean
    cleanedData = JSON.parse(JSON.stringify(rawData));

    let removedDuplicates = 0;
    let filledMissing = 0;

    // 1) Remove duplicate rows
    if (removeDuplicatesCheckbox.checked) {
        const seen = new Set();
        const uniqueData = [];

        cleanedData.forEach(row => {
            const key = JSON.stringify(row);
            if (!seen.has(key)) {
                seen.add(key);
                uniqueData.push(row);
            } else {
                removedDuplicates++;
            }
        });

        cleanedData = uniqueData;
    }

    // 2) Fill missing numeric values with the column average
    if (handleMissingCheckbox.checked && cleanedData.length > 0) {
        const columns = Object.keys(cleanedData[0]);

        columns.forEach(col => {
            // Collect numeric values for this column
            const nums = cleanedData
                .map(row => row[col])
                .filter(v => v !== '' && v !== null && v !== undefined && !isNaN(v))
                .map(v => parseFloat(v));

            if (nums.length === 0) return; // skip non-numeric columns

            const avg = nums.reduce((a, b) => a + b, 0) / nums.length;

            cleanedData.forEach(row => {
                if (row[col] === '' || row[col] === null || row[col] === undefined) {
                    row[col] = avg.toFixed(2);
                    filledMissing++;
                }
            });
        });
    }

    // Show a very simple text report
    const reportLines = [];
    reportLines.push('Cleaning complete.');
    reportLines.push(`Removed duplicate rows: ${removedDuplicates}`);
    reportLines.push(`Filled missing numeric cells: ${filledMissing}`);

    document.getElementById('reportSection').style.display = 'block';
    document.getElementById('cleaningReport').textContent = reportLines.join('\n');

    // Refresh stats + preview using cleaned data
    updateStatsAndPreview(cleanedData);

    // Enable download
    downloadBtn.disabled = false;
}

// -------------------------------------
// 7. Download cleaned data as a CSV
// -------------------------------------

function downloadCleanedData() {
    if (!cleanedData || cleanedData.length === 0) return;

    const csv = convertToCSV(cleanedData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Turn our array of objects back into CSV text
function convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const columns = Object.keys(data[0]);
    let csv = columns.join(',') + '\n';

    data.forEach(row => {
        const values = columns.map(col => {
            const value = row[col];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });

    return csv;
}
