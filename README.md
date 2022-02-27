
# README

In order to run the solution described in the problem1.txt file you will need to do a series of steps.

## Node.js & NPM

Install the latest version of Node.js and NPM by going to https://nodejs.org/en/download/

## Install dependencies

To install all the dependencies simply run 'npm install' inside the src folder.

## Compile

All the code is written in TypeScript so before it is run, it needs to be compiled to JavaScript. To do so, go inside the src folder and run 'npm run ts-compile'

## Execute

To run the api, either run 'npm start' or 'npm run start:dev'. The latter will reload the server if it detects any change in the code.

## Test

To execute all the tests, go inside the src folder and run 'npm test'. The code needs to be compiled in advance.

## Notes

* For type safety, I used TypeScript.

* As requested, no authentication has been implemented.

* There are tests for all the services' functions.

* I made getRewardsAccountPositions return an array instead of one object.

* Stock market here opens during weekdays between 8h and 16h.

* If we don't have enough shares to keep the cost of each new acquired custom under control, then we will send an error instead of giving a more expensive but available share.

* All api methods live under /api/*

* It's a HTTP RESTful API

* No database has been used, everything lives in the memory of the process so if it gets restarted, all changes will be lost.

