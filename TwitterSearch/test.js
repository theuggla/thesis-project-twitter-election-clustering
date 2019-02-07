// create a stdout and file logger
const log = require('simple-node-logger').createSimpleLogger('test.log')


const test_queries = [ 
  {
    query: 'clinton%20-filter%3Aretweets',
    fromDate: '201611010000',
    toDate: '201611070000',
    geocode: '38.8182197078527,-105.4182549803516,293km'
  }
]

log.info('log log')

log.info('created twitter request thing with options')
    log.info(test_queries)

    const getBearerToken = require('get-twitter-bearer-token')
 
    const twitter_consumer_key = '7NdWOW2WIQIjIKsoRkWTNnVG9'
    const twitter_consumer_secret = 'v1mkQzu4Gk3tRTVqZwpxP02RSvoSfpZaJfQaPCTLO38GOoYC41'
     
    getBearerToken(twitter_consumer_key, twitter_consumer_secret, (err, res) => {
      if (err) {
        // handle error
      } else {

        console.log(res.body)
        // bearer token
        console.log(res.body.access_token)
        log.info(res.body.access_token)
      }
    })