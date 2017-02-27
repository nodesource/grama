const askGrama = require('../')

const grama = askGrama({
    nodes: [
        { id: 10, tid: 3 }
      , { id: 11, tid: 3 }
      , { id: 12, tid: 3 }
      , { id: 13, tid: 11 }
      , { id: 14, tid: 11 }
      , { id: 15, tid: 13 }
      , { id: 16, tid: 13 } ]
    , id: 'id'
    , parentId: 'tid'
})

console.log('Closest ancestor of 15 and 16 is', grama.closestCommonAncestor(15, 16))
console.log('Closest ancestor of 15 and 11 is', grama.closestCommonAncestor(15, 11))
console.log('Closest ancestor of 16 and 13 is', grama.closestCommonAncestor(16, 13))

// Closest ancestor of 15 and 16 is 13
// Closest ancestor of 15 and 11 is 3
// Closest ancestor of 16 and 13 is 11
