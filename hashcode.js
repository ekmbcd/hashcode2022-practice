const fs = require('fs');
const readline = require('readline');

let times = 0

// class Client {
//   constructor(like, dislike) {
//     this.like = like;
//     this.dislike = dislike;
//   }
// }

// check if a set is a subset of another
Set.prototype.subSet = function(otherSet) 
{
  if(this.size > otherSet.size) 
    return false; 
  else
  {
    for(var elem of this) 
    { 
      if(!otherSet.has(elem)) 
        return false; 
    } 
    return true; 
  } 
}

// check if sets have a common element
Set.prototype.intersects = function(otherSet) 
{ 
  for(var elem of this) 
  { 
    if(otherSet.has(elem)) 
      return true; 
  } 
  return false; 
} 

// start with pizza with all ingredients
const allIngredients = new Set()

// keep set of removed ingredients
const discardedIngredients = new Set()

const fileName = process.argv[2]
if (!fileName) {
  console.log('enter file name')
  return
}

const clients = []

main()

async function main() {
  // parse file
  await parseFile(fileName)

  console.log('--', allIngredients)

  // calculate if removing ingredients increases the number of clients
  let bestDelta = 1

  // cycle until it is not convienient to remove
  while (bestDelta) {
    console.log('times:', times, 'bestdelta', bestDelta)
    times += 1
    bestDelta = 0
    // calculate number of satisfied clients
    const satisfiedClients = calculateSatisfied(discardedIngredients)

    let bestRemovedSet = new Set()

    let skipped = 0
    for (const client of clients) {

      // check if we need to skip
      if (isSkippable(client, discardedIngredients)) {
        skipped += 1
        continue
      }
      
      // calculate delta if we remove set of ingredients
      const tmpRemoved = new Set([...discardedIngredients])
      tmpRemoved.add(...client.dislike)
      const currentSatisfiedClients = calculateSatisfied(tmpRemoved)

      // find the best set of ingredients to remove
      if (currentSatisfiedClients - satisfiedClients > bestDelta) {
        bestDelta = currentSatisfiedClients - satisfiedClients
        bestRemovedSet = client.dislike
      }
    }
    console.log('skipped', skipped, 'out of', clients.length)

    // try again if we removed something
    if (bestDelta) {
      discardedIngredients.add(...bestRemovedSet)
    }
  }

  console.log('all ingredients', allIngredients)
  console.log('discarded ingredients', discardedIngredients)
  console.log('clients', calculateSatisfied(discardedIngredients))

  console.log('------------------------------------------')
  const result = []
  allIngredients.forEach(x => {
    if (!discardedIngredients.has(x))
      result.push(x)
  })
  console.log(result.length, ...result)
}


function isSatisfied(client, removed) {
  return (client.dislike.subSet(removed) && !removed.intersects(client.like))
}

function calculateSatisfied(removed) {
  let count = 0
  for (const client of clients) {
    if (isSatisfied(client, removed))
      count++
  }
  return count
}

function isSkippable(client, removed) {
  if (client.dislike.subSet(removed))
    return true
  
  if (client.like.intersects(removed))
    return true
  
  return false
}


async function parseFile(fileName) {
  const fileStream = fs.createReadStream(fileName);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  let lineNum = -1
  let client

  for await (const line of rl) {
    lineNum += 1
    if (lineNum === 1) {
      const like = line.split(' ')
      like.splice(0, 1)
      client = { like: new Set([...like]) }
      if (like.length > 0) {
        allIngredients.add(...like)
      }
    }
    else if (lineNum === 2) {
      lineNum = 0
      const dislike = line.split(' ')
      dislike.splice(0, 1)
      client.dislike = new Set([...dislike])
      if (dislike.length > 0) {
        allIngredients.add(...dislike)
      }
      clients.push(client)
    }
  }
  console.log('clients', clients)
}
