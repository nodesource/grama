const askGrama = require('../')
const test = require('tape').test
// eslint-disable-next-line no-unused-vars
function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

/*
 *            -- ReadStream:Open -- Read1 -- Read2 -- Read3 -- WriteStream:Close
 *          /                           \          \
 * Parent                                \           -- WriteStream:Write2
 *          \                              -- WriteStream:Write1
 *            -- WriteStream:Open
 */
const grama = askGrama({
    nodes: [
        { id: 10, tid: 3, type: 'parent' }
      , { id: 11, tid: 3, type: 'read:open' }
      , { id: 12, tid: 3, type: 'write:open' }
      , { id: 13, tid: 11, type: 'read:read1' }
      , { id: 14, tid: 13, type: 'read:read2' }
      , { id: 15, tid: 14, type: 'read:read3' }
      , { id: 16, tid: 11, type: 'write:write1' }
      , { id: 17, tid: 13, type: 'write:write2' }
      , { id: 18, tid: 14, type: 'write:close' } ]
    , id: 'id'
    , parentId: 'tid'
})

test('\nclosest sibling: closest of two write:writes', function(t) {
  function predicate({ descendantId, descendantDistance, ancestorId, ancestorDistance }) {
    if (!grama.has(descendantId)) return false
    const descendant = grama.get(descendantId)
    return descendant.type.startsWith('write:write')
  }

  const id = grama.closestSibling(18, predicate)
  t.equal(id, 17, 'finds closest sibling')
  t.end()
})

test('\nclosest sibling: closest and only write close sibling', function(t) {
  function predicate({ descendantId, descendantDistance, ancestorId, ancestorDistance }) {
    if (!grama.has(descendantId)) return false
    const descendant = grama.get(descendantId)
    return descendant.type.startsWith('write:open')
  }

  const id = grama.closestSibling(18, predicate)
  t.equal(id, 12, 'finds closest sibling')
  t.end()
})

test('\nall siblings: find all siblings to write:close that start with write:', function(t) {
  function predicate({ descendantId, descendantDistance, ancestorId, ancestorDistance }) {
    if (!grama.has(descendantId)) return false
    const descendant = grama.get(descendantId)
    return descendant.type.startsWith('write:')
  }

  const siblings = grama.allSiblings(18, predicate)
  t.deepEqual(Array.from(siblings), [ 17, 16, 12 ], 'finds all matching siblings')
  t.end()
})
