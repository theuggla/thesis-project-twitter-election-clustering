const fs = require('fs')
const dataLocation = './data/twitter'

fs.readdirSync(dataLocation).forEach((candidate) => {
  fs.readdirSync(`${dataLocation}/${candidate}`).forEach((location) => {
    let localizedCandidatePromises = []
    
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
                  
                  console.log(date)
                  tweets.add({text, date})
                }
              })
            }
            resolve(Array.from(tweets))
          })
        })
      )
    })

    Promise.all(localizedCandidatePromises).then((promises) => {
      let tweets = []
      promises.forEach((prom) => (tweets = tweets.concat(prom)))
      console.log(tweets.length)
  
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