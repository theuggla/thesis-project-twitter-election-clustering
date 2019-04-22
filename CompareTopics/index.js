// Imports
let fs = require('fs')

// Variables
let dataLocation = './data/other'
let finishedTopics = []

// Collects the topics given from the ClusTop-algorithm
// adjusts them in two different ways by removing common words, and
// saves the new topic-files
collectTopics()
.then((result) => {
  return cleanTopics(result)
})
.then((cleanedTopics) =>  {
  cleanedTopics.forEach((candAndLoc) => {
    saveFile(`${dataLocation}/topics/${candAndLoc.file}`, candAndLoc.topics)
  })

  return cleanedTopics
})
.then((topics) => {
  adjustForState(topics)
  adjustForCandidate(topics)
})
.catch((error) => {
  console.log(error)
})

/**
 * Loops through the communities-files
 * given by the ClusTop-algorithm, and
 * returns the communities for each
 * candidate and location as topics
 */
function collectTopics() {
  return new Promise((resolve, reject) => {
    let topicPromisesByCandAndLoc = []

    fs.readdirSync(`${dataLocation}/communities/`).forEach((file) => {
      topicPromisesByCandAndLoc.push(
        new Promise((resolve, reject) => {
          fs.readFile(`${dataLocation}/communities/${file}`, 'utf8', (err, data) => {
            let topics = JSON.parse(data)
            if (err || !topics || topics.error) reject(err || 'Could not parse data.')
            resolve({topics: topics, file: file})
          })
        })
      )
    })

    Promise.all(topicPromisesByCandAndLoc).then(topics => resolve(topics)).catch((error) => reject(error))
  })
}


/**
 * Saves a file with the given data at the given path.
 */
function saveFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, (JSON.stringify(data) + '\n'), {encoding: 'utf8'},
    (err) => {
      if (err) {
        reject('Error when saving file')
      } else {
        resolve('Successfully saved file')
      }
    }
  )
  })
}

/**
 * Takes an array of topics separated by
 * candidate and location, and cleans the
 * list by removing all topics with a word
 * count below a certain limit
 */
function cleanTopics(topicsByCandAndLoc) {
  return new Promise((resolve, reject) => {
    const finishedTopics = []
    
    topicsByCandAndLoc.forEach((candAndLoc) => {
      const cleanedTopics = []
      const topics = Object.keys(candAndLoc.topics)
      topics.forEach((topic) => {
        if (candAndLoc.topics[topic].length > 10) {
          cleanedTopics.push(candAndLoc.topics[topic])
        }
      })
  
      finishedTopics.push({file: candAndLoc.file, topics: cleanedTopics})
    })
    resolve(finishedTopics)
  })
}

/**
 * Takes an array of opics separated by candidate and
 * location and adjusts them with regards to the state
 * where they were produced - that is, removes all words 
 * within the topics that are the same within each of 
 * the state when talking about the different candidates: 
 * i.e when looking at the topics for Trump in Denver 
 * and comparing them to the topics for Clinton in Denver, 
 * all common words are removed. The adjusted topics 
 * are saved away in JSON-format by candidate and location.
 */
function adjustForState(topicCollections) {
  const columbus = []
  const denver = []

  const columbus_adjusted = []
  const denver_adjusted = []

  topicCollections.forEach((collection) => {
    if (collection.file.includes('denver')) {
      denver.push(collection)
    } else {
      columbus.push(collection)
    }
  })

  const columbus_intersections = new Set()

  columbus[0].topics.forEach((topic_a) => {
    columbus[1].topics.forEach((topic_b) => {
      let intersection = topic_a.filter(x => topic_b.includes(x))
      intersection.forEach(item => columbus_intersections.add(item))
    })
  })

  const denver_intersections = new Set()

  denver[0].topics.forEach((topic_a) => {
    denver[1].topics.forEach((topic_b) => {
      let intersection = topic_a.filter(x => topic_b.includes(x))
      intersection.forEach(item => denver_intersections.add(item))
    })
  })

  topicCollections.forEach((collection) => {
    if (collection.file.includes('denver')) {
      const adjusted_topics = []
      collection.topics.forEach((topic) => {
        adjusted_topics.push(topic.filter(x => ![...denver_intersections].includes(x)))
      })
      saveFile(`${dataLocation}/topics/adjust-for-state/${collection.file}`, adjusted_topics)
    } else {
      const adjusted_topics = []
      collection.topics.forEach((topic) => {
        adjusted_topics.push(topic.filter(x => ![...columbus_intersections].includes(x)))
      })
      saveFile(`${dataLocation}/topics/adjust-for-state/${collection.file}`, adjusted_topics)
    }
  })
}

/**
 * Takes an array of opics separated by candidate and
 * location and adjusts them with regards to the candidate 
 * they are talking about - that is, removes all words 
 * within the topics that are the same for each candidate 
 * across different states: i.e when looking at the topics 
 * for Trump in Denver and comparing them to the topics 
 * for Trump in Columbus, all common words are removed.
 * The adjusted topics are saved away in JSON-format 
 * by candidate and location.
 */
function adjustForCandidate(topicCollections) {
  const trump = []
  const clinton = []

  const trump_adjusted = []
  const clinton_adjusted = []

  topicCollections.forEach((collection) => {
    if (collection.file.includes('clinton')) {
      clinton.push(collection)
    } else {
      trump.push(collection)
    }
  })

  const trump_intersections = new Set()

  trump[0].topics.forEach((topic_a) => {
    trump[1].topics.forEach((topic_b) => {
      let intersection = topic_a.filter(x => topic_b.includes(x))
      intersection.forEach(item => trump_intersections.add(item))
    })
  })

  const clinton_intersections = new Set()

  clinton[0].topics.forEach((topic_a) => {
    clinton[1].topics.forEach((topic_b) => {
      let intersection = topic_a.filter(x => topic_b.includes(x))
      intersection.forEach(item => clinton_intersections.add(item))
    })
  })

  topicCollections.forEach((collection) => {
    if (collection.file.includes('clinton')) {
      const adjusted_topics = []
      collection.topics.forEach((topic) => {
        adjusted_topics.push(topic.filter(x => ![...clinton_intersections].includes(x)))
      })
      saveFile(`${dataLocation}/topics/adjust-for-candidate/${collection.file}`, adjusted_topics)
    } else {
      const adjusted_topics = []
      collection.topics.forEach((topic) => {
        adjusted_topics.push(topic.filter(x => ![...trump_intersections].includes(x)))
      })
      saveFile(`${dataLocation}/topics/adjust-for-candidate/${collection.file}`, adjusted_topics)
    }
  })
}