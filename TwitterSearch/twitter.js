// Imports
const request = require('request-promise')
const fs = require('fs')

// Class
class Twitter {
  constructor(options) {

    this.options = {
      headers: {
        'Authorization': `Bearer ${options.bearer_token}`,
        'content-type': 'application/json'
      },
      url: `https://api.twitter.com/1.1${options.twitter_search_path}`,
      json: true,
      body: {}
    }

    this.requests = 0
    this.RATE_LIMIT = 22
  }

  search(query, params) {
    this.requests += 1

    if (!params.page) {
      params.page = 1
    }

    let options = this.options
    options.body = query

    if (params.next && params.next.length > 0) {
      options.body.next = params.next
    }

    if (this.requests < this.RATE_LIMIT) {
      return new Promise((resolve, reject) => {
        request.post(options)
        .then((response) => {
          if (response.error) {
            reject(new Error('Error: ' + response.error.message))
          }
          fs.writeFile(`./data/twitter/${query.query}-next`, (JSON.stringify({page: params.page, next: response.next}) + '\n'), {encoding: 'utf8', flag: 'a'},
          (err) => {
            if (err) {
              console.log('Error when saving next-file')
            } else {
              console.log(`Successfully saved next-file`)
            }
          }
        )
          resolve({tweets: response.results, next: response.next, page: params.page})
        })
        .catch((error) => {
          reject(error)
        })
      })
    } else {
      setTimeout(() => {
        requests = 0
        return this.search(query, params)
      }, 65000)
    }
  }
}

// Exports
module.exports = Twitter