// Imports
const extend = require('deep-extend')
const request = require('request-promise')
const log = require('simple-node-logger').createSimpleLogger('twitter.log')

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

    log.info('created twitter request thing with options')
    log.info(this.options)
  }

  search(params, opts) {
    log.info('searching twitter with params')
    log.info(params)
    log.info('and opts')
    log.info(opts)

    this.requests += 1

    log.info('number of requests made: ' + this.requests)

    if (!opts.page) {
      opts.page = 1
    }

    let options = this.options
    options.body = params

    log.info('will be searching with options')
    log.info(options)

    return new Promise((resolve, reject) => {
      let tweets = []
      log.info('returning promise')

      log.info('requesting now')
      request.post(options)
      .then((response) => {
        log.info('returned from request')
        log.info('with response')
        
        if (response.error) {
          log.info('bad request')
          log.info('Error: ' + response.error.message)
          reject(new Error('Error: ' + response.error.message))
        }

        log.info('extending tweets')
        tweets.push(response.results)
        log.info('how many tweets? ' + response.results.length)

        log.info('does data have next?')
        log.info(response.next)

        log.info('do we want more pages?')
        log.info(opts.page <= opts.max_pages)

        if (response.next && opts.page < opts.max_pages) {
          log.info('data had next and we wanted more pages')
          options.body.next = response.next
          opts.page += 1

          log.info('are we below the rate limit?')
          log.info('requests: ' + this.requests)
          log.info('rate limit: ' + this.RATE_LIMIT)

          if (this.requests < this.RATE_LIMIT) {
            log.info('we were below the rate limit, searching again')
            return this.search(params, opts)
          } else {
            log.info('we were above the rate limit, setting timeout to search again')
            setTimeout(() => {
              log.info('timeout activated, searching again now')
              requests = 0
              return this.search(params, opts)
            }, 65000)
          }
        } else {
          log.info('no more pages wanted, resolving with tweets:')
          resolve(tweets)
        }
      })
      .then((result) => {
        log.info('returned from searching again, extending tweets')
        tweets.push(result)
        log.info('resolving with new tweets:')
        resolve(tweets)
      })
      .catch((error) => {
        log.info('got error in searching, will reject with it:')
        log.info(error)
        reject(error)
      })
    })
  }
}

// Exports
module.exports = Twitter