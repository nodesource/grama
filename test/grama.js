const askGrama = require('../')
const test = require('tape').test
// eslint-disable-next-line no-unused-vars
function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

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
      () => grama.closestCommonAncestor(10, 1)
    , /1 not found/
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
      () => grama.furthestCommonAncestor(10, 1)
    , /1 not found/
    , 'throws for ids that were not entered'
  )

  t.end()
})

test('\nclosest common ancestor using predicate', function(t) {
  [ [ 10, 11,  3 ]
  , [ 10, 12,  3 ]
  , [ 19, 10,  3 ]
  , [ 19, 14, 11 ]
  , [ 19, 18, 11 ]
  , [ 18, 15, 11 ]
  , [ 18, 13, 11 ]
  , [ 20, 19, null ]
  ].forEach(check)

  function predicate(id) {
    return id === 11 || id === 3
  }

  function check([ id1, id2, closest ]) {
    const res = grama.closestCommonAncestor(id1, id2, { predicate })
    t.equal(res, closest, `${id1} - ${id2} --> ${closest}`)
  }

  t.end()
})

test('\nfurthest common ancestor using predicate', function(t) {
  [ [ 10, 11, null ]
  , [ 10, 12, null ]
  , [ 19, 10, null ]
  , [ 19, 14, 11 ]
  , [ 19, 18, 11 ]
  , [ 18, 15, 11 ]
  , [ 18, 13, 11 ]
  , [ 20, 19, null ]
  ].forEach(check)

  function predicate(id) {
    return id === 11
  }

  function check([ id1, id2, furthest ]) {
    const res = grama.furthestCommonAncestor(id1, id2, { predicate })
    t.equal(res, furthest, `${id1} - ${id2} --> ${furthest}`)
  }

  t.end()
})

/* eslint-disable yoda */
test('\nclosest ancestor', function(t) {
  t.equal(grama.closestAncestor(18, id => id === 11), 11)
  t.equal(grama.closestAncestor(18, id => id > 15), null)
  t.equal(grama.closestAncestor(18, id => 11 < id && id < 15), 13)
  t.end()
})

test('\nclosest descendant', function(t) {
  t.equal(grama.closestDescendant(10, id => true), null)
  t.equal(grama.closestDescendant(11, id => id > 13), 19)
  t.end()
})

test('\nall ancestors matching predicate', function(t) {
  t.deepEqual(Array.from(grama.allAncestors(18, x => x < 13)), [ 3, 11 ])
  t.deepEqual(Array.from(grama.allAncestors(20, x => x < 2)), [])
  t.deepEqual(Array.from(grama.allAncestors(15, x => x > 3)), [ 11, 13 ])
  t.end()
})

test('\nall descendants matching predicate', function(t) {
  t.deepEqual(Array.from(grama.allDescendants(11, x => 13 < x && x < 17)), [ 16, 15, 14 ])
  t.deepEqual(Array.from(grama.allDescendants(10, x => true)), [])
  t.deepEqual(Array.from(grama.allDescendants(11, x => x < 12)), [])
  t.deepEqual(Array.from(grama.allDescendants(15, x => x !== 18)), [ 19 ])
  t.end()
})
