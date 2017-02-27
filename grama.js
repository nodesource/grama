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

class Grama {
  constructor({ nodes, id, parentId }) {
    this._nodes = this._mapOfNodes(nodes, id)
    this._id = id
    this._parentId = parentId
    this._buildAncestry()
  }

  _mapOfNodes(nodes, id) {
    function addToSet(acc, node) {
      acc.set(node[id], node)
      return acc
    }
    return nodes.reduce(addToSet, new Map())
  }

  _buildAncestry() {
    this._ancestry = new Map()
    // first determine direct parents
    for (const [ id, val ] of this._nodes) {
      const parent = val[this._parentId]
      const info = { parent, ancestors: new Map(), descendants: new Map() }
      info.ancestors.set(parent, 1)
      this._ancestry.set(id, info)
    }

    // Now iterate through the partially determined ancestry
    // and determine more ancient ancestors.
    // This algorithm is very simple as it processes one parent at a time
    // and could be improved by consuming ancestors of the parent itself,
    // but that'd be much more complex and error prone.
    let keepGoing = true
    while (keepGoing) {
      keepGoing = false

      for (const [ k, v ] of this._ancestry) {
        // find the most ancient ancestor we found so far and see if it itself has parent
        const [ id, distance ] = lastMapEntry(v.ancestors)
        // We may not know about that ancestor which means we are done with this child.
        if (!this._ancestry.has(id)) continue

        const parent = this._ancestry.get(id)
        const grandParent = parent.parent
        v.ancestors.set(grandParent, distance + 1)
        parent.descendants.set(k, distance)
        keepGoing = true
      }
    }
  }

  commonAncestors(id1, id2) {
    if (!this._ancestry.has(id1)) throw new Error(`Id ${id1} not found in the ancestry.`)
    if (!this._ancestry.has(id2)) throw new Error(`Id ${id2} not found in the ancestry.`)

    const a = this._ancestry.get(id1)
    const b = this._ancestry.get(id2)

    const common = new Map()
    for (const [ id, distance1 ] of a.ancestors) {
      if (!b.ancestors.has(id)) continue
      const distance2 = b.ancestors.get(id)
      common.set(id, { distance1, distance2, totalDistance: distance1 + distance2 })
    }
    return common
  }

  closestCommonAncestor(id1, id2) {
    const common = this.commonAncestors(id1, id2)
    let closest = { id: null, distance: Number.MAX_SAFE_INTEGER }
    for (const [ id, { totalDistance: distance } ] of common) {
      if (distance < closest.distance) closest = { id, distance }
    }
    return closest.id
  }

  furthestCommonAncestor(id1, id2) {
    const common = this.commonAncestors(id1, id2)
    let furthest = { id: null, distance: 0 }
    for (const [ id, { totalDistance: distance } ] of common) {
      if (distance > furthest.distance) furthest = { id, distance }
    }
    return furthest.id
  }

  get summary() {
    return {
        nodes    : this._nodes
      , ancestry : this._ancestry
    }
  }
}

module.exports = function askGrama({ nodes, id, parentId }) {
  return new Grama({ nodes, id, parentId })
}
