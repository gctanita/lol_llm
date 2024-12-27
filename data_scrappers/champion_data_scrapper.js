const https = require('https');
const fs = require('fs');

// Path to the JSON file
const filePath = 'training-data/champion.json';

// Read and parse the JSON file
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);

        // Extract the names of the child objects from the "data" object
        const championNames = Object.keys(jsonData.data);

        console.log('Champion Names:', championNames);

        // let name = championNames[0];
        championNames.forEach((name) => {
            console.log('Champion Name:', name);

            const url = 'https://ddragon.leagueoflegends.com/cdn/14.24.1/data/en_US/champion/' + name + '.json'; 
            const outputFilePath = 'training-data/champions/' + name + '.json';

            console.log("\t URL: " + url);
            fetchAndSave(url, outputFilePath);
        });
    } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
    }
});

// Function to perform a GET request and save the response to a file
function fetchAndSave(url, outputFilePath) {
    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Failed to fetch URL. Status Code: ${response.statusCode}`);
            response.resume(); // Consume response data to free up memory
            return;
        }

        let rawData = '';

        // Collect data chunks
        response.on('data', (chunk) => {
            rawData += chunk;
        });

        // Process the complete response
        response.on('end', () => {
            try {
                // Parse JSON and pretty print it
                const parsedData = JSON.parse(rawData);
                const prettyJson = JSON.stringify(parsedData, null, 4);

                // Write the formatted JSON to the file
                fs.writeFile(outputFilePath, prettyJson, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing to file:', err);
                        return;
                    }
                    console.log(`Formatted JSON saved to ${outputFilePath}`);
                });
            } catch (err) {
                console.error('Error parsing JSON:', err.message);
            }
        });
    }).on('error', (err) => {
        console.error(`Error: ${err.message}`);
    });
}

// // Replace with your desired URL and output file path
// const url = 'https://ddragon.leagueoflegends.com/cdn/14.24.1/data/en_US/champion/'; // Example URL
// const outputFilePath = 'response.json';

// fetchAndSave(url, outputFilePath);
