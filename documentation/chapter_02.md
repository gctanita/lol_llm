# Scraping for data

So, we need data to train the AI. Cool... Now what?

Went to developer.riotgames.com and created an api key, and started reading the documentation. The next step was to save the static info, and the champion information depending on the version. 

all have been saved in the "training-data" folder, with the help of a quick and dirty script "champion_data_scrapper.js"

Now that we have the static data, or relativley static data, we need to get the user information and match history. 

I will create a yet another quick and dirty script that will make calls and gather the info we need. I will be using for this 2 databases: a mysql and a mongoDb. I will use the mysql to keep track of the scrapping of data, and the results of the scrapping will go to mongoDb. 

The Riot API  have a restriction, and we can make a maximum of 100 requests in 120 seconds. so in between calls we will need to have a 1300 milis wait, in order to ensure that we don't get banned :D Oh boy, this is gonna take a while... 

The scraping steps are as follows, starting from an initial PUUID
- get account => GET https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/--PUUID--?api_key=--api_key--

- get challenges => https://eun1.api.riotgames.com/lol/challenges/v1/player-data/--PUUID--?api_key=--api_key--

- get champion mastery => https://eun1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/--PUUID--?api_key=--api_key--

- get mastery score => https://eun1.api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/--PUUID--?api_key=--api_key--

- get match histry => https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/--PUUID--/ids?queue=450&start=0&count=100&api_key=--api_key--

- get match info => https://europe.api.riotgames.com/lol/match/v5/matches/--match_id--
?api_key=--api_key--

- get match timeline => https://europe.api.riotgames.com/lol/match/v5/matches/--match_id--/timeline?api_key=--api_key--


In order to keep track, once the **get match info** call is made, the other players will get saved in the DB, in a table called **user_tracking**.

Once the get match history call is made, the list of matches will be saved in a table called **match_tracking**.

Once the match timeline is saved, the entry from user_tracking and the one from match_tracking will be updated, with status "DONE"

Script will go to the next user, after finishing to extract the data for all the matches of the user. 

SQL for user_tracking:
```
CREATE TABLE user_tracking (
    user_puuid VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('NEW', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'NEW',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

SQL for match_tracking:
```
CREATE TABLE match_tracking (
    match_id VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('NEW', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'NEW',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

For the MongoDb we will create a database called lol_data, that will have the following collections:
- user_account
- user_challenges
- user_champion_mastery
- user_mastery_score
- user_match_history
- match_info
- match_timeline

