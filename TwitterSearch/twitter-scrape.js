// Imports
const fs = require('fs')
const moment = require('moment')
const Twitter = require('./twitter')
const log = require('simple-node-logger').createSimpleLogger('twitter-scrape.log')

// Variables
const secrets = require('./secrets')
const month = 'February'

const queries = [ 
  {
    query: 'clinton place:Denver',
    fromDate: '201610010000',
    toDate: '201611070000'
  },
  {
    query: 'trump place:Denver',
    fromDate: '201610010000',
    toDate: '201611070000'
  }
]

  const client = new Twitter({
    twitter_search_path: secrets.customSearchPath,
    bearer_token: secrets.bearerToken
  })

  moment.locale('sv')

queries2.forEach((query) => {
  log.info('will be getting tweets for query')
  log.info(query)
  getTweets(query)
    .then((message) => {
      log.info('got tweets with message:')
      log.info(message)
    })
    .catch((err) => {
      log.info('did not get tweets, instead error:')
      log.info(err);
    })
})


function getTweets(query) {
  log.info('inside getTweets')
  return new Promise((resolve, reject) => {
    log.info('search client')
    client.search( query , { method: 'post', max_pages: 1 } )
    .then((tweets) => {
      log.info('got return of tweets:')
      return saveTweets(tweets, query)
    })
    .then((result) => {
      log.info('result of saving tweets:')
      log.info(result)
      resolve(result)
    })
    .catch((error) => {
      log.info('error in retrieving or saving tweets:')
      reject(error)
    })
  })
}

function saveTweets(tweets, query) {
  return new Promise((resolve, reject) => {
    log.info('saving tweets')
    const timestamp = moment().format('L')
    const filename = `${timestamp}.json`
    const filepath = `./data/twitter/${month}-${query.query}-${filename}`
    const data = JSON.stringify(tweets)
    log.info('all variables set for saving')

    fs.writeFile(filepath, data, 'utf8',
      (err) => {
        log.info('callback from saved')
        if (err) {
          log.info('got error from saving:')
          log.info(err)
          reject(err);
        } else {
          log.info('succeeded in saving, resolving')
          resolve(`Successfully saved ${filename}`);
        }
      }
    )
  })
}