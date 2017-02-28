function lastMapEntry(map) {
  let entry = null
  const entries = map.entries()
  while (true) {
    const { done, value } = entries.next()
    if (done) break
    entry = value
  }
  return entry
}

function sortMap(map, comparator) {
  function callComparator(a, b) {
    return comparator(a[0], b[0], a[1], b[1])
  }

  const sortedArray = Array.from(map).sort(callComparator)
  return new Map(sortedArray)
}

function byDistance(ka, kb, va, vb) {
  return va.distance < vb.distance ? -1 : 1
}

function sortMapByDistance(map) {
  return sortMap(map, byDistance)
}

module.exports = {
    lastMapEntry
  , sortMap
  , sortMapByDistance
}
