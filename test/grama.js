const askGrama = require('../')
const test = require('tape').test

const grama = askGrama({
    nodes: [
        { id: 10, tid: 3 }
      , { id: 11, tid: 3 }
      , { id: 12, tid: 3 }
      , { id: 13, tid: 11 }
      , { id: 14, tid: 13 }
      , { id: 15, tid: 13 }
      , { id: 16, tid: 13 }
      , { id: 18, tid: 15 }
      , { id: 19, tid: 15 }
      , { id: 20, tid:  2 } ]
    , id: 'id'
    , parentId: 'tid'
})

test('\nclosest common ancestor', function(t) {
  [ [ 10, 11,  3 ]
  , [ 10, 12,  3 ]
  , [ 19, 10,  3 ]
  , [ 19, 14, 13 ]
  , [ 19, 18, 15 ]
  , [ 18, 15, 13 ]
  , [ 18, 13, 11 ]
  , [ 20, 19, null ]
  ].forEach(check)

  function check([ id1, id2, closest ]) {
    const res = grama.closestCommonAncestor(id1, id2)
    t.equal(res, closest, `${id1} - ${id2} --> ${closest}`)
  }

  t.throws(
      () => grama.closestCommonAncestor(10, 3)
    , /3 not found/
    , 'throws for ids that were not entered'
  )

  t.end()
})

test('\nfurthest common ancestor', function(t) {
  [ [ 10, 11,  3 ]
  , [ 10, 12,  3 ]
  , [ 19, 10,  3 ]
  , [ 19, 14,  3 ]
  , [ 19, 18,  3 ]
  , [ 18, 15,  3 ]
  , [ 18, 13,  3 ]
  , [ 20, 19, null ]
  ].forEach(check)

  function check([ id1, id2, furthest ]) {
    const res = grama.furthestCommonAncestor(id1, id2)
    t.equal(res, furthest, `${id1} - ${id2} --> ${furthest}`)
  }

  t.throws(
      () => grama.furthestCommonAncestor(10, 3)
    , /3 not found/
    , 'throws for ids that were not entered'
  )

  t.end()
})
