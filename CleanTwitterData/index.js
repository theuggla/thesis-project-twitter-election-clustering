// Imports
const fs = require('fs')
const dataLocation = './data/twitter'

// Clean data to only save the tweet and date of the tweet
// and save in a single file as an array of cleaned tweet-objects
fs.readdirSync(dataLocation).forEach((candidate) => {
  fs.readdirSync(`${dataLocation}/${candidate}`).forEach((location) => {
    let localizedCandidatePromises = []
    
    // Clean up tweets to an array of promises that will  resolve
    // with collections based on candidate and location
    fs.readdirSync(`${dataLocation}/${candidate}/${location}`).forEach((file) => {
      localizedCandidatePromises.push(
        new Promise((resolve, reject) => {
          fs.readFile(`${dataLocation}/${candidate}/${location}/${file}`, 'utf8', (err, data) => {
            if (err) throw err

            const tweetCollection = JSON.parse(data)
            let tweets = new Set()

            if (!tweetCollection.error) {
              tweetCollection.forEach((tweet) => {
                if (tweet) {
                  const text = tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text
                  const date = tweet.created_at
                  tweets.add({text, date})
                }
              })
            }
            resolve(Array.from(tweets))
          })
        })
      )
    })

    // Concat cleaned tweets from all files and save into single file
    Promise.all(localizedCandidatePromises).then((promises) => {
      let tweets = []
      promises.forEach((prom) => (tweets = tweets.concat(prom)))

      console.log(`${candidate} - ${location}: ${tweets.length}`)
  
      fs.writeFile(`./data/other/${candidate}-${location}`, (JSON.stringify(tweets) + '\n'), {encoding: 'utf8', flag: 'a'},
        (err) => {
          if (err) {
            console.log('Error when saving clean-tweets-file')
          } else {
            console.log(`Successfully saved clean-tweets-file`)
          }
        }
      )
    })
  })
})