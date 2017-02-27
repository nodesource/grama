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

  get allNodes() {
    return this._nodes
  }

  summary() {
    return {
        nodes: this.allNodes
      , ancestry: this._ancestry
    }
  }
}

// eslint-disable-next-line no-unused-vars
function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

const grama = new Grama({
    nodes: [
        { type: 'FSREQWRAP', id: 10, tid: 3 }
      , { type: 'FSREQWRAP', id: 11, tid: 3 }
      , { type: 'TickObject', id: 12, tid: 3 }
      , { type: 'FSREQWRAP', id: 13, tid: 11 }
      , { type: 'FSREQWRAP', id: 14, tid: 13 }
      , { type: 'FSREQWRAP', id: 15, tid: 13 }
      , { type: 'TickObject', id: 16, tid: 13 }
      , { type: 'FSREQWRAP', id: 18, tid: 15 }
      , { type: 'FSREQWRAP', id: 19, tid: 15 } ]
    , id: 'id'
    , parentId: 'tid'
})

inspect(grama.summary())
