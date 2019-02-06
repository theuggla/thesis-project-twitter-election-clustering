// Imports
const fs = require('fs')
const moment = require('moment')
const Twitter = require('./twitter');

// Variables
const SERCRETS = require('./secrets')
const MONTH = 'February'
const queries = ['clinton%20-filter%3Aretweets%20since%3A2016-11-01%20until%3A2016-11-07%20geocode%3A38.81821970785270%2C-105.4182549803516%2C293km']
const client = new Twitter({
  consumer_key: secrets.consumerKey,
  consumer_secret: secrets.consumerSecret,
  access_token_key: secrets.accessToken,
  access_token_secret: secrets.accessTokenSecret,
  twitter_search_path: secrets.customSearchPath


// Setup
moment.locale('sv')

queries.forEach((query) => {
  getTweets(query)
    .then((message) => {
      console.log(message);
    })
    .catch((err) => {
      console.log(err);
    });
});


function getTweets(query) {
  return new Promise((resolve, reject) => {
    client.search( { q: query }, { method: 'post', max_pages: 60 } )
    .then((tweets) => {
      console.log('tweets')
      return saveTweets(tweets)
    })
    .then((result) => {
      console.log(result)
      resolve(result)
    })
    .catch((error) => {
      console.log('error')
      reject(error)
    })
  })
}

function saveTweets(tweets) {
  return new Promise((resolve, reject) => {
    const timestamp = moment().format('L')
    const filename = `${timestamp}.json`
    const filepath = `./data/twitter/${month}/${q.query}/${filename}`
    const data = JSON.stringify(tweets)

    fs.writeFile(filepath, data, 'utf8',
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(`Successfully saved ${filename}`);
        }
      }
    )
  })
}