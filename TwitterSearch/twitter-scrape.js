// Imports
const fs = require('fs')
const moment = require('moment')
moment.locale('sv')
const Twitter = require('./twitter')

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
  },
  {
    query: 'clinton place:Columbus',
    fromDate: '201610010000',
    toDate: '201611070000'
  },
  {
    query: 'trump place:Columbus',
    fromDate: '201610010000',
    toDate: '201611070000'
  }
]

const client = new Twitter({
  twitter_search_path: secrets.customSearchPath,
  bearer_token: secrets.bearerToken
})

queries.forEach((query) => {
  getTweets(query)
    .then((message) => {
      console.log(message)
    })
    .catch((err) => {
      console.log(err)
    })
})


function getTweets(query) {
  return new Promise((resolve, reject) => {
    client.search( query , { method: 'post', max_pages: 12 } )
    .then((tweets) => {
      return saveTweets(tweets, query)
    })
    .then((result) => {
      resolve(result)
    })
    .catch((error) => {
      reject(error)
    })
  })
}

function saveTweets(tweets, query) {
  return new Promise((resolve, reject) => {
    const timestamp = moment().format('L')
    const filename = `${timestamp}.json`
    const filepath = `./data/twitter/${month}-${query.query}-${filename}`
    const data = JSON.stringify(tweets)

    fs.writeFile(filepath, data, 'utf8',
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(`Successfully saved ${filename}`)
        }
      }
    )
  })
}