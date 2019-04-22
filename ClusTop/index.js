// Imports
let openNLP = require('../modules/node-opennlp')
let louvain = require('louvain').jLouvain
let fs = require('fs')

// Variables
let tokenizer = new openNLP().tokenizer
let posTagger = new openNLP().posTagger
let dataLocation = './data/other'
let blacklist = ['trump', 'donald', 'hillary', 'hilary', 'clinton']

createNewNetworksAndCollections()

/** 
 * Find communities of topics within each collection of tweets
 * Save file with separated communities as arrays of words
 * belonging to each community
**/
function createNewNetworksAndCollections() {
  collectTweets()
  .then((collections) => {
    let collectionPartitions = collections.map(collection => clusTop(collection))
    return Promise.all(collectionPartitions)
  })
  .then((result) => {
    result.forEach((collection) => {
      const communities = {}
      Object.keys(collection.communities).forEach((key) => {
        if (!communities.hasOwnProperty(collection.communities[key])) {
          communities[collection.communities[key]] = []
        }
        communities[collection.communities[key]].push(key)
      })

      saveFile(`${dataLocation}/communities/${collection.file}`, communities)
    })
  })
  .catch((error) => {
    console.log(error)
  })
}

/**
 * Collects the tweets from the clean-tweets file. 
 */
function collectTweets() {
  return new Promise((resolve, reject) => {
    let tweetCollectionPromisesByCandAndLoc = []

    fs.readdirSync(`${dataLocation}/cleaned/`).forEach((file) => {
      tweetCollectionPromisesByCandAndLoc.push(
        new Promise((resolve, reject) => {
          fs.readFile(`${dataLocation}/cleaned/${file}`, 'utf8', (err, data) => {
            let tweets = JSON.parse(data, (key, value) => (typeof value == 'object' && key != '') ? value.text : value)
            if (err || !tweets || tweets.error) reject(err || 'Could not parse data.')
            resolve({tweets: tweets, file: file})
          })
        })
      )
    })

    Promise.all(tweetCollectionPromisesByCandAndLoc).then(collections => resolve(collections)).catch((error) => reject(error))
  })
}

/**
 * Creates a network and separates the tweets into topics
 * using the louvain community detection
 * algorithm, as laid out in this paper:
 * https://www.researchgate.net/publication/321050909_ClusTop_A_Clustering-based_Topic_Modelling_Algorithm_for_Twitter_using_Word_Networks
 */
function clusTop(collection) {
  return new Promise((resolve, reject) => {
    createNetwork(collection.tweets)
    .then((network) => {
      let networkNodeData = new Set()
      let networkEdgeData = []

      network.forEach((cluster) => {cluster.nodes.forEach((item) => networkNodeData.add(item))})
      network.forEach((cluster) => {cluster.edges.forEach((item) => networkEdgeData.push(item))})

      communities = detectCommunities([...networkNodeData], networkEdgeData)
      resolve({file: collection.file, communities: communities})
    })
    .catch((error) => {
      reject(error)
    })
  })
}

/**
 * Saves a file with the given data at the given path.
 */
function saveFile(path, data) {
  fs.writeFile(path, (JSON.stringify(data) + '\n'), {encoding: 'utf8'},
    (err) => {
      if (err) {
        console.log('Error when saving file')
      } else {
        console.log('Successfully saved file')
      }
    }
  )
}

/**
 * Construct network based on co-noun usage as unigrams.
 **/
function createNetwork(tweets) {
  let count = 0
  return tweets.reduce((promiseChain, tweet) => {
    return promiseChain.then((chainResults) => {
      return getNodesAndEdges(tweet).then((currentResult) => {
        count++
        console.log(count + '/' + tweets.length)
        return [ ...chainResults, currentResult ]
      })
    })
  }, Promise.resolve([])).then((arrayOfResults) => {
    return arrayOfResults
  })
}

/**
 * Gets nodes as unigrams where unigrams is
 * represented by nouns, and edges between them
 * for the given tweet.
 */
function getNodesAndEdges(tweet) {
  return new Promise((resolve, reject) => {
    getNounsFromTweet(tweet)
    .then((result) => {
      let nodes = addNodesToNetwork(result)
      let edges = addEdgesToNetwork(result)

      resolve({nodes: nodes, edges: edges})
    })
    .catch((error) => {
      reject(error)
    })
  })
}

/**
 * Finds the communities with highest correlation
 * given the nodes and edges and returns them
 * as an object where each node has a community key
 * like {it1: 0, it2: 0, it3: 1}
 * @param {[string]} nodes the nodes to use, strings as keys like ['it1', 'it2']
 * @param {[Object]} edges the edges between the nodes as {source: 'it1', target: 'it2', weight: 3}
 */
function detectCommunities(nodes, edges) {
  let community = louvain().nodes(nodes).edges(edges)
  let communities  = community()

  return communities
}

/**
 * Extracts the nouns from the tweet and returns
 * an array with the nouns.
 */
function getNounsFromTweet(tweet) {
  let tokenizedSentence = []
  let categories = []

  return new Promise((resolve, reject) => {
    getTokenizedSentence(tweet)
    .then((result) => {
      tokenizedSentence = result
      return getCategories(tokenizedSentence.join(' '))
    })
    .then((result) => {
      categories = result
      return getNouns(tokenizedSentence, categories)
    })
    .then((result) => {
      nouns = result
      return cleanUp(nouns)
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
 * Adds the nodes to the network if they do not already exist.
 */
function addNodesToNetwork(nodes) {
  let networkNodeData = new Set()
  nodes.forEach(item => networkNodeData.add(item))
  return [...networkNodeData]
}

/**
 * Adds edges between the nodes given, or increments
 * weight of edge by 1 if it already exists.
 */
function addEdgesToNetwork(nodes) {
  let newtworkEdgeData = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        if (newtworkEdgeData.filter(edge => (edge.source === nodes[i] && edge.target === nodes[j])).length > 0) {
          newtworkEdgeData.find(edge => (edge.source === nodes[i] && edge.target === nodes[j])).weight += 1.0
        } else {
          newtworkEdgeData.push({source: nodes[i], target: nodes[j], weight: 1.0})
        }
      }
    }
  }
  return newtworkEdgeData
}

/**
 * Tokenizes a sentence and returns it as a 
 * new string with whitespace between all tokens.
 * @param {String} sentence the sentence  to tokenize.
 */
function getTokenizedSentence(sentence) {
  return new Promise((resolve, reject) => {
    tokenizer.tokenize(sentence, (err, results) => {
      if (err) {
        reject('Could not tokenize sentence.')
      }
      resolve(results)
    })
  })
}

/**
 * Analyzes a sentence and returns array
 * with all tokens in the sentence marked as
 * part-of-speech.
 * @param {String} sentence the sentence to analyze.
 */
function getCategories(sentence) {
  return new Promise((resolve, reject) => {
    posTagger.tag(sentence, (err, categorized) => {
      if (err) reject('Could not categorize sentence.')

      resolve(categorized)
    })
  })
}

/**
 * Returns all the nouns in the sentence as lower case, 
 * according to the given categories.
 * @param {Array} sentence a tokenized sentence.
 * @param {Array} categories the categories to use, nouns should start with 'N
 */
function getNouns(sentence, categories) {
  return new Promise((resolve, reject) => {
    let nouns = []
    categories.forEach((category, index) => {
      if (category[0] === 'N') nouns.push(sentence[index].toLowerCase())
    })
    resolve(nouns)
  })
}

/**
 * Cleans upthe word list by removing all words from the blacklist as well as
 * all twitter-handles.
 */
function cleanUp(words) {
  return new Promise((resolve, reject) => {
    let cleaned = []

    blacklist.forEach((b_word) => {
      words.forEach((word) => {
        if (!(word.startsWith('@') || word.startsWith('.@') || word.includes('://') || word.includes(b_word))) {
          cleaned.push(word)
        }
      })
    })
    
    resolve(cleaned)
  })
}