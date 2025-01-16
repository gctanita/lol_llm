const mysql = require('mysql2/promise');
const fs = require('fs');
const https = require('https');
const { MongoClient } = require('mongodb');

const DB_CONNECTION_DATA = {
    host: 'localhost',
    user: 'root',
    password: 'parolamea',
    database: 'data_indexing'
};
const TRACKER_STATUS = {
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    COLLECTED_USER_MATCHES: "COLLECTED_USER_MATCHES",
    COLLECTED_MATCH_INFO: "COLLECTED_MATCH_INFO"
}
const TRACKING_CATEGORY = {
    USER: "user_tracking",
    MATCH: "match_tracking"
}

const MONGO_DB_CONNECTION_STRING = 'mongodb://root:example@localhost:27017/';
const MONGO_DB_NAME = 'lol_data';
const MONGO_COLLECTIONS = {
    MATCH_INFO: "match_info",
    MATCH_TIMELINE: "match_timeline",
    USER_ACCOUNT: "user_account",
    USER_CHALLENGES: "user_challenges",
    USER_CHAMPION_MASTERIES: "user_champion_mastery",
    USER_MASTERY_SCORE: "user_mastery_score",
    USER_MATCH_HISTORY: "user_match_history"
}

let API_KEY = '';

function waitBetweenCalls() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1500); 
    });
}

function readFirstLine(filePath) {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
      let data = '';
      let position = 0;
      let index;
  
      stream.on('data', (chunk) => {
        data += chunk;
        index = data.indexOf('\n'); // Find the newline character
        if (index !== -1) {
          stream.close(); // Stop reading the file
        }
      });
  
      stream.on('close', () => {
        resolve(data.slice(0, index !== -1 ? index : undefined)); // Return first line
      });
  
      stream.on('error', (err) => {
        reject(err);
      });
    });
 }

async function fetchTopNewEntries() {
    return await fetchTopNewEntries(TRACKING_CATEGORY.USER);
}

async function fetchTopNewEntries(table) {
    try {
        // Connect to the database
        const connection = await mysql.createConnection(DB_CONNECTION_DATA);

        // Query to fetch the top 1 entries with status "NEW"
        const query = `
            SELECT * 
            FROM ${table}
            WHERE status = 'NEW'
            ORDER BY timestamp ASC
            LIMIT 1;
        `;

        // Execute the query
        const [rows] = await connection.execute(query);

        // Close the connection
        await connection.end();

        if (rows.length !== 0){
            return rows[0];
        } 
        return null;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

async function updateStatus(table, userPuuid, status) {
    try {
        // Connect to the database
        const connection = await mysql.createConnection(DB_CONNECTION_DATA);

        // Update query
        const query = `
            UPDATE ${table}
            SET status = ?
            WHERE id = ?;
        `;

        // Execute the query with the provided user_puuid
        const [result] = await connection.execute(query, [status, userPuuid]);

        // Close the connection
        await connection.end();

        // Check if a row was updated
        if (result.affectedRows > 0) {
            console.log(`Successfully updated status to ${status} for user_puuid: ${userPuuid}`);
            return true;
        } else {
            console.log(`No user found with user_puuid: ${userPuuid}`);
            return false;
        }
    } catch (error) {
        console.error('Error updating user status:', error.message);
        return false;
    }
}

async function saveToMongoDb(document, collectionName) {
    try {
        // Connect to MongoDB
        const client = new MongoClient(MONGO_DB_CONNECTION_STRING);
        await client.connect();

        // console.log('Connected to MongoDB');

        // Access the database and collection
        const db = client.db(MONGO_DB_NAME);
        const collection = db.collection(collectionName);

        // Insert the document
        const result = await collection.insertOne(document);

        // console.log('Document inserted with ID:', result.insertedId);

        // Close the connection
        await client.close();
        // console.log('Connection closed');
    } catch (error) {
        console.error('Error saving to MongoDB:', error.message);
    }
}

function getFromUrl(url) {
    console.log(`asking data from ${url}`)
    return new Promise((resolve, reject) => {
        
        https.get(url, (response) => {
        let data = '';

        // Accumulate chunks of data as they arrive
        response.on('data', (chunk) => {
            data += chunk;
        });

        // Handle the end of the response
        response.on('end', () => {
            try {
                // Parse the accumulated data as JSON
                const jsonResponse = JSON.parse(data);
                resolve(jsonResponse);
            } catch (error) {
                reject(new Error('Failed to parse JSON: ' + error.message));
            }
        });
        }).on('error', (error) => {
            reject(new Error('HTTP GET request failed: ' + error.message));
        });
    });
}

async function insertEntry(table, id) {
    try {
        // Connect to the database
        const connection = await mysql.createConnection(DB_CONNECTION_DATA);

        // Insert query
        const query = `
            INSERT IGNORE INTO ${table} (id)
            VALUES (?);
        `;

        // Execute the query with matchId and status
        const [result] = await connection.execute(query, [id]);

        console.log(`New ${table} entry inserted `);

        // Close the connection
        await connection.end();

        return result; // Return the auto-generated ID (if applicable)
    } catch (error) {
        console.error('Error inserting match entry:', error.message);
        throw error; // Rethrow the error for further handling
    }
}

async function insertErrorEntry(id, url) {
    try {
        // Connect to the database
        const connection = await mysql.createConnection(DB_CONNECTION_DATA);

        // Insert query
        const query = `
            INSERT INTO error_log (id, url)
            VALUES (?, ?);
        `;

        // Execute the query with matchId and status
        const [result] = await connection.execute(query, [id, url]);

        console.log(`New error_log entry inserted `);

        // Close the connection
        await connection.end();

        return result; // Return the auto-generated ID (if applicable)
    } catch (error) {
        console.error('Error inserting match entry:', error.message);
        throw error; // Rethrow the error for further handling
    }
}

function initialRun() {
    // Run the function
    (async () => {
        let user = await fetchTopNewEntries();
        while (user !== null) {
            let currentUrl = "";
            const USER_PUUID = user.id;
            try {            
                // console.log("We will be obtaining data for " + USER_PUUID);

                await updateStatus(TRACKING_CATEGORY.USER, USER_PUUID, TRACKER_STATUS.IN_PROGRESS);

                API_KEY = await readFirstLine('sensitive/riot-api-key.txt');

                const urlGetAccount = `https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${USER_PUUID}?api_key=${API_KEY}`;
                const urlGetChallanges = `https://eun1.api.riotgames.com/lol/challenges/v1/player-data/${USER_PUUID}?api_key=${API_KEY}`;
                const urlGetChampionMasteries = `https://eun1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${USER_PUUID}?api_key=${API_KEY}`;
                const urlGetMatchHistory = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${USER_PUUID}/ids?queue=450&start=0&count=100&api_key=${API_KEY}`;


                // console.log("\tStep 1: Get and Save User Account info");
                currentUrl = urlGetAccount;
                await saveToMongoDb(await getFromUrl(urlGetAccount), MONGO_COLLECTIONS.USER_ACCOUNT);
                await waitBetweenCalls();

                // console.log("\tStep 2: Get and Save User Challanges info");
                currentUrl = urlGetChallanges;
                await saveToMongoDb(await getFromUrl(urlGetChallanges), MONGO_COLLECTIONS.USER_CHALLENGES);
                await waitBetweenCalls();

                // console.log("\tStep 3: Get and Save User Champion Mastery");
                currentUrl = urlGetChampionMasteries;
                const user_champion_masterties = await getFromUrl(urlGetChampionMasteries);
                const number_of_masteries = user_champion_masterties.length;
                for (let i = 0; i < number_of_masteries; i++) {
                    await saveToMongoDb(user_champion_masterties[i], MONGO_COLLECTIONS.USER_CHAMPION_MASTERIES);
                }
            
                // console.log("\tStep 4: Get Match History and info");
                currentUrl = urlGetMatchHistory;
                const match_history_list = await getFromUrl(urlGetMatchHistory);
                const number_of_match_history_entries = match_history_list.length;
                await waitBetweenCalls();

                for (let i = 0; i < number_of_match_history_entries; i++) {
                    const currentMatch =  match_history_list[i];

                    const json = {
                        "puuid": USER_PUUID,
                        "match_id": currentMatch
                    };
                    await saveToMongoDb(json, MONGO_COLLECTIONS.USER_MATCH_HISTORY);
                    await insertEntry(TRACKING_CATEGORY.MATCH, currentMatch);

                    await updateStatus(TRACKING_CATEGORY.MATCH, currentMatch, TRACKER_STATUS.IN_PROGRESS);
                    // console.log(`\t\tStep 4.1: Get Match Info for ${currentMatch}`);
                    const urlGetMatchInfo = `https://europe.api.riotgames.com/lol/match/v5/matches/${currentMatch}?api_key=${API_KEY}`;
                    const urlGetMatchTimeline = `https://europe.api.riotgames.com/lol/match/v5/matches/${currentMatch}/timeline?api_key=${API_KEY}`;

                    currentUrl = urlGetMatchHistory;
                    const match_info = await getFromUrl(urlGetMatchInfo);
                    await waitBetweenCalls();
                    const participantsList = match_info.metadata.participants;
                    await saveToMongoDb(match_info, MONGO_COLLECTIONS.MATCH_INFO);

                    const noOfParticipants = participantsList.length;
                    for (let j = 0; j < noOfParticipants; j++) {
                        await insertEntry(TRACKING_CATEGORY.USER, participantsList[j]);
                    }

                    // console.log(`\t\tStep 4.2: Get Match Timeline for ${currentMatch}`);
                    currentUrl = urlGetMatchTimeline;
                    await saveToMongoDb(await getFromUrl(urlGetMatchTimeline), MONGO_COLLECTIONS.MATCH_TIMELINE);
                    await updateStatus(TRACKING_CATEGORY.MATCH, currentMatch, TRACKER_STATUS.DONE);
                    await waitBetweenCalls();
                }
                await updateStatus(TRACKING_CATEGORY.USER, USER_PUUID, TRACKER_STATUS.DONE);
                // console.log(`~~~ JOB DONE USER ${USER_PUUID}~~~`);
                
            } catch (exception) {
                console.log(`Issue with ${USER_PUUID} => ${currentUrl}`);

                insertErrorEntry(USER_PUUID, currentUrl)
            }
            user = await fetchTopNewEntries();
        }
        // console.log("~~~ JOB DONE ~~~");
    })();
}


(async () => {
    let user = null;
    let match = null;

    API_KEY = await readFirstLine('sensitive/riot-api-key.txt');

    user = await fetchTopNewEntries(TRACKING_CATEGORY.USER);
    match = await fetchTopNewEntries(TRACKING_CATEGORY.MATCH);

    while ((user !== null) || (match !== null)) {
        while (user !== null) {
            let currentUrl = "";
            const USER_PUUID = user.id;

            await updateStatus(TRACKING_CATEGORY.USER, USER_PUUID, TRACKER_STATUS.IN_PROGRESS);
                    
            try {  
                const urlGetMatchHistory = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${USER_PUUID}/ids?queue=450&start=0&count=100&api_key=${API_KEY}`;
                currentUrl = urlGetMatchHistory;
                    const match_history_list = await getFromUrl(urlGetMatchHistory);
                    const number_of_match_history_entries = match_history_list.length;
                    await waitBetweenCalls();

                    for (let i = 0; i < number_of_match_history_entries; i++) {
                        const currentMatch =  match_history_list[i];

                        const json = {
                            "puuid": USER_PUUID,
                            "match_id": currentMatch
                        };
                        await saveToMongoDb(json, MONGO_COLLECTIONS.USER_MATCH_HISTORY);
                        await insertEntry(TRACKING_CATEGORY.MATCH, currentMatch);
                    }

                    await updateStatus(TRACKING_CATEGORY.USER, USER_PUUID, TRACKER_STATUS.COLLECTED_USER_MATCHES);
            } catch (exception) {
                console.log(`!!! Issue with ${USER_PUUID} => ${currentUrl}`);

                insertErrorEntry(USER_PUUID, currentUrl)
            }
            user = await fetchTopNewEntries(TRACKING_CATEGORY.USER);
        }

        while (match !== null) {
            let currentUrl = "";
            const currentMatch = match.id;

            await updateStatus(TRACKING_CATEGORY.MATCH, currentMatch, TRACKER_STATUS.IN_PROGRESS);
            try {  
                const urlGetMatchInfo = `https://europe.api.riotgames.com/lol/match/v5/matches/${currentMatch}?api_key=${API_KEY}`;
                currentUrl = urlGetMatchInfo;
                const match_info = await getFromUrl(urlGetMatchInfo);
                await waitBetweenCalls();
                await saveToMongoDb(match_info, MONGO_COLLECTIONS.MATCH_INFO);

                const participantsList = match_info.metadata.participants;
                const noOfParticipants = participantsList.length;
                for (let j = 0; j < noOfParticipants; j++) {
                    await insertEntry(TRACKING_CATEGORY.USER, participantsList[j]);
                }

                await updateStatus(TRACKING_CATEGORY.MATCH, currentMatch, TRACKER_STATUS.COLLECTED_MATCH_INFO);
            } catch (exception) {
                console.log(`!!! Issue with ${currentMatch} => ${currentUrl}`);

                insertErrorEntry(currentMatch, currentUrl)
            }
            match = await fetchTopNewEntries(TRACKING_CATEGORY.MATCH);
        }

        user = await fetchTopNewEntries(TRACKING_CATEGORY.USER);
        match = await fetchTopNewEntries(TRACKING_CATEGORY.MATCH);
    }
})();