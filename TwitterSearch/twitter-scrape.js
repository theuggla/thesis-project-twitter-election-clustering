// Imports
const fs = require('fs')
const moment = require('moment')
moment.locale('sv')
const Twitter = require('./twitter')

// Variables
const secrets = require('./secrets')
const month = 'March'

const queries = [
  /*{
    query: 'clinton place:Denver',
    fromDate: '201610010000',
    toDate: '201611070000',
    next: 'eyJhdXRoZW50aWNpdHkiOiI5ZDBmZWYyMWE0NTM0MWQ1NDhkOWE2YWI5NmExNGVlNmRjM2MwMzE3YjE1MTE0YTU5MzU3YTc5ODJlNzU5NjY5IiwiZnJvbURhdGUiOiIyMDE2MTAwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MTEwNzAwMDAiLCJuZXh0IjoiMjAxNjEwMDcxODU5MzgtNzg0NDY4MjQxNTE1MTA2MzAzLTAifQ=='
  },
  {
    query: 'trump place:Denver',
    fromDate: '201610010000',
    toDate: '201611070000',
    next: 'eyJhdXRoZW50aWNpdHkiOiI0ZWFjZTFlYTE3ODAyNzM5NTFmYTY2ZTU5MzRlZGQwYjFkOTk3ZTBhZGNjODgyMmEyMmNhMzYwOGY2ODI5YWZkIiwiZnJvbURhdGUiOiIyMDE2MTAwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MTEwNzAwMDAiLCJuZXh0IjoiMjAxNjEwMjgwNDQyNDAtNzkxODYyNzI0NDUxOTMwMTExLTAifQ=='
  },*/
  {
    query: 'clinton place:Columbus',
    fromDate: '201609010000',
    toDate: '201610010000',
    /*next: 'eyJhdXRoZW50aWNpdHkiOiI1YTgzYjNmNzIzN2JmMDVkZjQzYTQwYzM4MzE5ZGRmZmE4YzMwMWUwMDljNDVjNmYwNWJjMWUwOWYxMzU2YjIwIiwiZnJvbURhdGUiOiIyMDE2MTAwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MTEwNzAwMDAiLCJuZXh0IjoiMjAxNjEwMjAyMDUwMDItNzg5MjA3MDY5Mjc4NzQwNDc5LTAifQ=='*/
  },
  /*{
    query: 'trump place:Columbus',
    fromDate: '201610010000',
    toDate: '201611070000',
    next: 'eyJhdXRoZW50aWNpdHkiOiI5MWRhZjI3MGJmMWVjNGEwOWM4YjJlYzI4YzEzY2Q0NzNmYTgxN2E5NWM1OGYxNWI3MjY5NjU4ODgzOTBlZjY5IiwiZnJvbURhdGUiOiIyMDE2MTAwMTAwMDAiLCJ0b0RhdGUiOiIyMDE2MTEwNzAwMDAiLCJuZXh0IjoiMjAxNjEwMjAxODQwNTEtNzg5MTc0NTU5MTI3Njc4OTc1LTAifQ=='
  }*/
]

const client = new Twitter({
  twitter_search_path: secrets.customSearchPath,
  bearer_token: secrets.bearerToken
})

queries.forEach((query) => {
  getTweets(query, {page: 11})
    .then((message) => {
      console.log('done')
    })
    .catch((err) => {
      console.log(err)
    })
})


function getTweets(query, params) {
  return new Promise((resolve, reject) => {
    const max_pages = 11
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