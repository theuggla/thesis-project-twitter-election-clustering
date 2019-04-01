// Imports
let openNLP = require('../modules/node-opennlp')
let louvain = require('louvain').jLouvain
let fs = require('fs')

// Variables
let tokenizer = new openNLP().tokenizer
let posTagger = new openNLP().posTagger
let dataLocation = './data/other'

// Construct network based on co-noun usage as unigrams
let tweet1 = 'Pierre Vinken, 61 years old, will join the board as a nonexecutive director Nov. 29.'
let tweet2 = 'Margreth, 61 years old, will join the board as a nonexecutive secretary Sept. 29.'

fs.readdirSync(`${dataLocation}/cleaned/`).forEach((file) => {
  let communityPromisesByCandAndLoc = []
  communityPromisesByCandAndLoc.push(
    new Promise((resolve, reject) => {
      fs.readFile(`${dataLocation}/cleaned/${file}`, 'utf8', (err, data) => {
        if (err) reject(err)

        console.log('reading ' + file)

        let tweets = []
        let tweetCollection = JSON.parse(data)

        if (!tweetCollection.error) {
          tweetCollection.forEach((tweet) => {
            if (tweet && tweet.text) {
              tweets.push(tweet.text)
            }
          })
        }

        console.log('resolving with ' + tweets.length + ' tweets')
        resolve({tweets: tweets, file: file})
      })
    })
  )

  Promise.all(communityPromisesByCandAndLoc).then((promises) => {
    promises.forEach((prom) => {
      console.log('creating network for ' + prom.file)
      createNetwork(prom.tweets)
      .then((network) => {
        console.log('network created for ' + prom.file + ' adding up nodes and edges')
        let networkNodeData = new Set()
        let networkEdgeData = []

        network.forEach((cluster) => {cluster.nodes.forEach((item) => networkNodeData.add(item))})
        network.forEach((cluster) => {cluster.edges.forEach((item) => networkEdgeData.push(item))})

        console.log('detecting communities with ' + networkNodeData.size + ' nodes and ' + networkEdgeData.length + ' edges')

        communities = detectCommunities([...networkNodeData], networkEdgeData)

        fs.writeFile(`./data/other/communities/${prom.file}`, (JSON.stringify(communities) + '\n'), {encoding: 'utf8', flag: 'a'},
          (err) => {
            if (err) {
              console.log('Error when saving communities-file')
            } else {
              console.log('Successfully saved communities-file')
            }
          }
        )
      })
      .catch((error) => {
        console.log(error)
      })
    })
  })
})

function createNetwork(tweets) {
  let count = 0
  return Promise.all(tweets.map((tweet) => {
    count++
    console.log(count)
    if (count < 50) {
      console.log('returing at once')
      return getNodesAndEdges(tweet)
    } else {
      console.log('setting timeout')
      setTimeout(() => {
        console.log('returnig from timeout')
        count = 0
        return getNode(tweet)
      }, 65000)
    }
    
  }))
}

function getNodesAndEdges(tweet) {
  return new Promise((resolve, reject) => {
    getNounsFromTweet(tweet)
    .then((result) => {
      let nodes = addNodesToNetwork(result)
      let edges = addEdgesToNetwork(result)
      console.log('resolving nodes and edges')

      resolve({nodes: nodes, edges: edges})
    })
    .catch((error) => {
      reject(error)
    })
  })
}

function detectCommunities(nodes, edges) {
  let community = louvain().nodes(nodes).edges(edges)
  let communities  = community()

  return communities
}


function getNounsFromTweet(tweet) {
  let tokenizedSentence = []
  let categories = []

  return new Promise((resolve, reject) => {
    getTokenizedSentence(tweet)
    .then((result) => {
      console.log('got tokenized tweet')
      tokenizedSentence = result
      return getCategories(tokenizedSentence.join(' '))
    })
    .then((result) => {
      categories = result
      return getNouns(tokenizedSentence, categories)
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
      console.log('returned from tokenization')
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