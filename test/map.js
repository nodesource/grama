const { lastMapEntry, sortMap, sortMapByDistance } = require('../lib/map')

const test = require('tape')

test('\nlast map entry', function(t) {
  const lastone = [ 8, 8 ]
  const lasttwo = [ 'a', 'a' ]
  const one = new Map([ [ 1, 1 ], [ 2, 2 ], lastone ])
  const two = new Map([ [ 'x', 'x' ], [ 'b', 'b' ], lasttwo ])

  t.deepEqual(lastMapEntry(one), lastone)
  t.deepEqual(lastMapEntry(two), lasttwo)

  t.end()
})

test('\nsort map', function(t) {
  function byKey(ka, kb, va, vb) { return ka < kb ? -1 : 1 }
  function byVal(ka, kb, va, vb) { return va < vb ? -1 : 1 }

  const map = new Map([ [ 2, 11 ], [ 1, 22 ], [ 3, 0 ] ])
  const keysorted = sortMap(map, byKey)
  t.deepEqual(Array.from(keysorted), [ [ 1, 22 ], [ 2, 11 ], [ 3, 0 ] ], 'sorts correctly by key')

  const valsorted = sortMap(map, byVal)
  t.deepEqual(Array.from(valsorted), [ [ 3, 0 ], [ 2, 11 ], [ 1, 22 ] ], 'sorts correctly by val')
  t.end()
})

test('\nsort map by distance', function(t) {
  const map = new Map([ [ 1, { distance: 9 } ], [ 2, { distance: 7 } ], [ 3, { distance: 8 } ] ])
  const sorted = sortMapByDistance(map)
  t.deepEqual(Array.from(sorted), [
      [ 2, { distance: 7 } ],
      [ 3, { distance: 8 } ],
      [ 1, { distance: 9 } ] ]
    , 'sorts correctly by distance'
  )
  t.end()
})
