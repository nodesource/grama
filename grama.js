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

  /**
   * Returns all common ancestors of id1 and id2.
   * If either id1 or id2 are not found in the ancestry an error is thrown.
   *
   * @name grama.commonAncestors
   * @function
   * @param {String|Number} id1 the first id
   * @param {String|Number} id2 the second id
   * @return {Map.<String|Number, Object} a map of all common ancestors found. Each
   * ancestor has the following properties:
   * - distance1: the distance from id1 to the ancestor
   * - distance2: the distance from id2 to the ancestor
   * - totalDistance: the sum of distance1 and distance1
   */
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

  _closestCommonAncestorNoPredicate(id1, id2) {
    const common = this.commonAncestors(id1, id2)
    let closest = { id: null, distance: Number.MAX_SAFE_INTEGER }
    for (const [ id, { totalDistance: distance } ] of common) {
      if (distance < closest.distance) closest = { id, distance }
    }
    return closest.id
  }

  _closestCommonAncestorWithPredicate(id1, id2, predicate) {
    const common = this.commonAncestors(id1, id2)
    let closest = { id: null, distance: Number.MAX_SAFE_INTEGER }
    for (const [ id, { totalDistance: distance } ] of common) {
      if (distance < closest.distance && predicate(id)) closest = { id, distance }
    }
    return closest.id
  }

  _furthestCommonAncestorNoPredicate(id1, id2) {
    const common = this.commonAncestors(id1, id2)
    let furthest = { id: null, distance: 0 }
    for (const [ id, { totalDistance: distance } ] of common) {
      if (distance > furthest.distance) furthest = { id, distance }
    }
    return furthest.id
  }

  _furthestCommonAncestorWithPredicate(id1, id2, predicate) {
    const common = this.commonAncestors(id1, id2)
    let furthest = { id: null, distance: 0 }
    for (const [ id, { totalDistance: distance } ] of common) {
      if (distance > furthest.distance && predicate(id)) furthest = { id, distance }
    }
    return furthest.id
  }

  /**
   * Returns the id of the closest ancestor of id1 and id2.
   * If either id1 or id2 are not found in the ancestry an error is thrown.
   *
   * When using the predicate a return value of `false` will cause grama to look
   * for the next closest common ancestor, i.e. the returned id is not of the actual
   * closest ancestor, but the closest one that matches the predicate.
   *
   * @name grama.closestCommonAncestor
   * @function
   * @param {String|Number} id1 the first id
   * @param {String|Number} id2 the second id
   * @param {Object} $0 options
   * @param {Function} [$0.predicate=null] a function that if supplied needs to
   *  return `true` in order to accept the common ancestor.
   *  If not supplied the actual closest common ancestor is accepted.
   * @return {String|Number} the id of the closest common ancestor or `null` if it doesn't exist
   */
  closestCommonAncestor(id1, id2, { predicate = null } = {}) {
    return predicate != null
      ? this._closestCommonAncestorWithPredicate(id1, id2, predicate)
      : this._closestCommonAncestorNoPredicate(id1, id2)
  }

  /**
   * Returns the id of the furthest ancestor of id1 and id2.
   * If either id1 or id2 are not found in the ancestry an error is thrown.
   *
   * When using the predicate a return value of `false` will cause grama to look
   * for the next furthest common ancestor, i.e. the returned id is not of the actual
   * furthest ancestor, but the furthest one that matches the predicate.
   *
   * @name grama.furthestCommonAncestor
   * @function
   * @param {String|Number} id1 the first id
   * @param {String|Number} id2 the second id
   * @param {Object} $0 options
   * @param {Function} [$0.predicate=null] a function that if supplied needs to
   *  return `true` in order to accept the common ancestor.
   *  If not supplied the actual furthest common ancestor is accepted.
   * @return {String|Number} the id of the furthest common ancestor or `null` if it doesn't exist
   */
  furthestCommonAncestor(id1, id2, { predicate = null } = {}) {
    return predicate != null
      ? this._furthestCommonAncestorWithPredicate(id1, id2, predicate)
      : this._furthestCommonAncestorNoPredicate(id1, id2)
  }

  get summary() {
    return {
        nodes    : this._nodes
      , ancestry : this._ancestry
    }
  }
}

/**
 * Creates grama who will tell you about the ancestry of the nodes you passed.
 *
 * @name askGrama
 * @function
 * @param {Object} $0 options
 * @param {Array.<Object>} $0.nodes the nodes to be added to the ancestry
 * @param {String} $0.id the name of the property that returns the id of each node
 * @param {String} $0.parentId the name of the property that returns the id of the parent of each node
 * @return {Object} an instance of Grama
 */
module.exports = function askGrama({ nodes, id, parentId }) {
  return new Grama({ nodes, id, parentId })
}
