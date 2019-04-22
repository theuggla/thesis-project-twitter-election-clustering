// Imports
const fs = require('fs')
const moment = require('moment')
moment.locale('sv')
const Twitter = require('./twitter')

// Variables
const secrets = require('./secrets')
const month = 'April'

// Queries
const queries = [
  {
    query: 'clinton place:Denver',
    fromDate: '20161007000',
    toDate: '201611070000',
    next: 'eyJhdXRoZW50aWNpdHkiOiJhNTgwMTQ2NjhkY2JkNWJiNGFmOGJkMTUwMmU4MTJlZjNmOTEzODlkYWQyNTZiYzZiMjYyYWE4ZmRhZDgzNmNiIiwiZnJvbURhdGUiOiIyMDE2MDgwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MTAwMTAwMDAiLCJuZXh0IjoiMjAxNjEwMDEwMDAwMDAtNzYyNjIyMTY3MDQxMzcyMTYwLTAifQ=='
  },
  {
    query: 'trump place:Denver',
    fromDate: '20161007000',
    toDate: '201611070000',
    next: 'eyJhdXRoZW50aWNpdHkiOiI1NDE1NzI4YmY0ZjJkNzcyZDQxNjg5MzhmMTQxODQ5YjRlNDFmNDlmZTQ2NzNhYzY3ZDgzNjZjNjI3Mjg3YTg2IiwiZnJvbURhdGUiOiIyMDE2MTAwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MTEwNzAwMDAiLCJuZXh0IjoiMjAxNjExMDcwMDAwMDAtNzg2NjY4ODQ5ODk0NjAwNzA1LTAifQ=='
  },
  {
    query: 'clinton place:Columbus',
    fromDate: '201605010000',
    toDate: '201608010000',
    next: 'eyJhdXRoZW50aWNpdHkiOiJmNjAxNTY3NmRkNmVkNDZmMjZiNWZjMzE3ZmZjNzFlNjE1Yjk5ZmNiZjFjMDVlMTVlOGE3NTg5NmUwYjFhOTMxIiwiZnJvbURhdGUiOiIyMDE2MDUwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MDgwMTAwMDAiLCJuZXh0IjoiMjAxNjA4MDEwMDAwMDAtNzUzNzkyODc4NTM1NTA3OTY5LTAifQ=='
  },
  {
    query: 'trump place:Columbus',
    fromDate: '201610010000',
    toDate: '201611070000',
    next: 'eyJhdXRoZW50aWNpdHkiOiIzNjEwYThmNjVhZjJjMzdiYzk0M2MxMDViYzA1YWJhMDY3MWE1ZTQ1OWE1MDYyMDY4YTBmZGM1OWZjN2NkMTgyIiwiZnJvbURhdGUiOiIyMDE2MTAwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MTEwNzAwMDAiLCJuZXh0IjoiMjAxNjExMDcwMDAwMDAtNzg1MzEzNjA5NTg0OTMwODE2LTAifQ=='
  }
]

// Twitter client
const client = new Twitter({
  twitter_search_path: secrets.customSearchPath,
  bearer_token: secrets.bearerToken
})

// Collect and save tweets
queries.forEach((query) => {
  getTweets(query, {page: 13})
    .then((message) => {
      console.log('Done collecting and saving tweets.')
    })
    .catch((err) => {
      console.log(err)
    })
})

/**
 * Gets tweets through the Twitter API using
 * the given query.
 * @param {Object} query the query to use
 * @param {Object} params the params to use - takes the {page: 10} 
 * param to limit the number of pages queried.
 */
function getTweets(query, params) {
  return new Promise((resolve, reject) => {
    const max_pages = 13
    let result = {}

    client.search(query, params)
    .then((response) => {
      result = response
      return saveTweets(result.tweets, query, result.page)
    })
    .then(() => {
      if (result.next && result.page < max_pages) {
        params.next = result.next
        params.page = result.page += 1
        return getTweets(query, params)
      } else {
        return Promise.resolve(result)
      }
    })
    .then((result) => {
      resolve(result)
    })
    .catch((error) => {
      reject(error)
    })
  })
}

/**
 * Saves the tweets in JSON format with
 * the query, time and page number in the file name.
 */
function saveTweets(tweets, query, page) {
  return new Promise((resolve, reject) => {
    const timestamp = moment().format('L')
    const filename = `${timestamp}.json`
    const filepath = `./data/twitter/${month}-${query.query}-p${page}-${filename}`
    const data = JSON.stringify(tweets)

    fs.writeFile(filepath, data, 'utf8',
      (err) => {
        if (err) {
          reject(err)
        } else {
          console.log(`Successfully saved ${filepath}`)
          resolve(`Successfully saved ${filepath}`)
        }
      }
    )
  })
}