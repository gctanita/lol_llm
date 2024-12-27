const https = require('https');
const fs = require('fs');
const path = require('path');

function waitOneSecond() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000); // Wait for 1000 milliseconds (1 second)
    });
}

function saveChampionsToVersion(version) {
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
                waitOneSecond();
                console.log('\tChampion Name:', name);

                const url = 'https://ddragon.leagueoflegends.com/cdn/' + version + '/data/en_US/champion/' + name + '.json'; 
                const outputFilePath = 'training-data/champions_' + version + '/' + name + '.json';

                waitOneSecond();
                console.log("\t\t URL: " + url);
                fetchAndSave(url, outputFilePath);
                waitOneSecond();
            });
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
        }
    });
}

// Function to perform a GET request and save the response to a file
function fetchAndSave(url, outputFilePath) {
    https.get(url, (response) => {
        console.log("call to " + url);
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

                waitOneSecond();
                // Write the formatted JSON to the file
                fs.writeFile(outputFilePath, prettyJson, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing to file:', err);
                        return;
                    }
                    console.log(`Formatted JSON saved to ${outputFilePath}`);
                    waitOneSecond();
                });
            } catch (err) {
                console.error('Error parsing JSON:', err.message);
            }
        });
    }).on('error', (err) => {
        console.error(`Error: ${err.message}`);
    });
}


function fetchSubsetUntilValue(url, startIndex, stopValue, callback) {
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
                // Parse the JSON array
                const dataArray = JSON.parse(rawData);

                // Ensure it's an array
                if (!Array.isArray(dataArray)) {
                    throw new Error('Response is not an array.');
                }

                // Extract values from startIndex up to (but not including) stopValue
                const result = [];
                for (let i = startIndex; i < dataArray.length; i++) {
                    if (dataArray[i] === stopValue) break;
                    result.push(dataArray[i]);
                }

                // Execute the callback with the result
                callback(null, result);
            } catch (err) {
                console.error('Error processing response:', err.message);
                callback(err);
            }
        });
    }).on('error', (err) => {
        console.error(`Error: ${err.message}`);
        callback(err);
    });
}

const url = 'https://ddragon.leagueoflegends.com/api/versions.json'; // Replace with your API URL
const startIndex = 0; // Start from position 0
let stopValue = '9.17.1'; // Stop at this value
// let stopValue = '10.2.1'; // Stop at this value
// let stopValue = '10.10.5'; // Stop at this value
// let stopValue = '10.19.1'; // Stop at this value
// let stopValue = '11.4.1'; // Stop at this value
// let stopValue = '11.14.1'; // Stop at this value
// let stopValue = '11.24.1'; // Stop at this value
 //stopValue = '14.12.1'; // ovverride

fetchSubsetUntilValue(url, startIndex, stopValue, (err, subset) => {
    if (err) {
        console.error('Failed to fetch and process data:', err);
    } else {
        console.log('Extracted Subset:', subset);

        subset.forEach((version) => {
             console.log("Version: " + version);
             const folderName = 'training-data/version_' + version;

            const target_name = [
                "championFull",
                "item",
                "item-modifiers",
                "map",
                "runesReforged",
                "spellbuffs",
                "summoner"
            ];

            target_name.forEach((target) => {
                waitOneSecond();

                const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/${target}.json`;
                const outputFilePath = `training-data/version_${version}/${target}.json`;

                fetchAndSave(url, outputFilePath);
                waitOneSecond();
            });

           

             

            // // Create the folder asynchronously
            // fs.mkdir(folderName, { recursive: true }, (err) => {
            //     if (err) {
            //         return console.error(`Error creating folder: ${err.message}`);
            //     }
            //     console.log(`Folder "${folderName}" created successfully!`);
            // });

            // waitOneSecond();
            // saveChampionsToVersion(value);
            // waitOneSecond();


            // const folderName = 'training-data/version_' + value;

            // // Create the folder asynchronously
            // fs.mkdir(folderName, { recursive: true }, (err) => {
            //     if (err) {
            //         return console.error(`Error creating folder: ${err.message}`);
            //     }
            //     console.log(`Folder "${folderName}" created successfully!`);
            // });



            // MOVE THE FILES 
            // const version = value; // Replace with the desired version number
            // const sourceFolder = `training-data/champions_${version}`;
            // const destinationFolder = `training-data/version_${version}/champions`;

            // fs.mkdir(destinationFolder, { recursive: true }, (err) => {
            //     if (err) {
            //         console.error(`Error creating destination folder: ${err.message}`);
            //         return;
            //     }

            //     console.log(`Destination folder "${destinationFolder}" is ready.`);

            //     // Read files in the source folder
            //     fs.readdir(sourceFolder, (err, files) => {
            //         if (err) {
            //             console.error(`Error reading source folder: ${err.message}`);
            //             return;
            //         }

            //         // Iterate through each file in the source folder
            //         files.forEach((file) => {
            //             const sourceFilePath = path.join(sourceFolder, file);
            //             const destinationFilePath = path.join(destinationFolder, file);

            //             // Move the file
            //             fs.rename(sourceFilePath, destinationFilePath, (err) => {
            //                 if (err) {
            //                     console.error(`Error moving file "${file}": ${err.message}`);
            //                 } else {
            //                     console.log(`Moved file "${file}" to "${destinationFilePath}"`);
            //                 }
            //             });
            //         });
            //     });
            // });
        })
    }
});