// Imports
const request = require('request-promise')

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

  search(params, opts) {
    this.requests += 1

    if (!opts.page) {
      opts.page = 1
    }

    let options = this.options
    options.body = params

    return new Promise((resolve, reject) => {
      let tweets = []
      request.post(options)
      .then((response) => {
        
        if (response.error) {
          reject(new Error('Error: ' + response.error.message))
        }

        tweets.push(response.results)

        if (response.next && opts.page < opts.max_pages) {
          options.body.next = response.next
          opts.page += 1

          if (this.requests < this.RATE_LIMIT) {
            return this.search(params, opts)
          } else {
            setTimeout(() => {
              requests = 0
              return this.search(params, opts)
            }, 65000)
          }
        } else {
          resolve(tweets)
        }
      })
      .then((result) => {
        tweets.push(result)
        resolve(tweets)
      })
      .catch((error) => {
        reject(error)
      })
    })
  }
}

// Exports
module.exports = Twitter