// Imports
const url = require('url')
const request = require('request-promise')
const extend = require('deep-extend')
const VERSON = 0.1

// Class
class Twitter {
  constructor(options) {
    this.options = extend({
      consumer_key: null,
      consumer_secret: null,
      access_token_key: null,
      access_token_secret: null,
      rest_base: 'https://api.twitter.com/1.1',
      search_url: `/tweets/search/${options.twitter_search_path}`
      request_options: {
        headers: {
          Accept: '*/*',
          Connection: 'close',
          'User-Agent': 'election-twitter/' + VERSION,
          'content-type': 'application/json'
        }
      }
    }, options)
  
    // Authentication
    const authentication_options = {
      oauth: {
        consumer_key: this.options.consumer_key,
        consumer_secret: this.options.consumer_secret,
        token: this.options.access_token_key,
        token_secret: this.options.access_token_secret
      }
    }
  
    // Configure default request options
    this.request = request.defaults(
      extend(
        this.options.request_options,
        authentication_options
      )
    )

    this.requests = 0
    this.RATE_LIMIT = 22
  }

  search(params, opts) {
    this.requests += 1

    if (!opts.page) {
      opts.page = 0
    }

    // Build the options to pass to our custom request object
    let options = {
      method: opts.method.toLowerCase(),  // Request method - get || post
      url: `${this.options.rest_base}${this.options.search_url}`
      json: true
    }

    // Pass url parameters if get
    if (options.method === 'get') {
      options.qs = params;
    }

    // Pass params as body if post
    if (options.method === 'post') {
      options.body = params
    }

    return new Promise((resolve, reject) => {
      let tweets = {}

      request(options)
      .then((response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('HTTP Error: ' + response.statusCode + ' ' + response.statusMessage))
        }

        tweets = extend(response.data)

        if (data.next && opts.page <= opts.max_pages) {
          options.body.next = data.next
          opts.page += 1

          if (this.requests < this.RATE_LIMIT) {
            return this.search(params, opts)
          } else {
            setTimeout(() => {
              requests = 0;
              return this.search(params, opts)
            }, 65000)
          }
        } else {
          resolve(tweets)
        }
      })
      .then((result) => {
        tweets = extend(result)
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