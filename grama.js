const { lastMapEntry, sortMapByDistance } = require('./lib/map')
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
      const info = { parent, ancestors: new Map(), descendants: new Map(), node: true }
      info.ancestors.set(parent, 1)
      this._ancestry.set(id, info)
    }

    // Now fill in any parents that were not part of the passed nodes, however
    // we need to have an entry for them in the ancestry in order for up -> down
    // lookups to work properly, i.e. closestSibling
    const fillin = new Map()
    for (const val of this._ancestry.values()) {
      const parent = val.parent
      if (this._ancestry.has(parent)) continue
      const info = { parent: null, ancestors: new Map(), descendants: new Map(), node: false }
      fillin.set(parent, info)
    }

    for (const [ k, v ] of fillin) {
      this._ancestry.set(k, v)
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
        if (v == null || v.ancestors == null || v.ancestors.size === 0) continue

        // find the most ancient ancestor we found so far and see if it itself has parent
        const [ id, distance ] = lastMapEntry(v.ancestors)
        // We may not know about that ancestor which means we are done with this child.
        if (!this._ancestry.has(id)) continue

        const parent = this._ancestry.get(id)
        parent.descendants.set(k, distance)

        const grandParent = parent.parent
        if (grandParent != null) {
          v.ancestors.set(grandParent, distance + 1)
          keepGoing = true
        }
      }
    }

    // Finally let's sort the ancestors and descendants by distance so we can rely on it
    // in some queries like closestAncestor and closestDescendant.
    // In most cases they'll be sorted already, but here we enforce this 100%.
    for (const v of this._ancestry.values()) {
      v.ancestors = sortMapByDistance(v.ancestors)
      v.descendants = sortMapByDistance(v.descendants)
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

  _ensureInAncestry(id) {
    if (!this._ancestry.has(id)) throw new Error(`${id} not found in the ancestry`)
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
    this._ensureInAncestry(id1)
    this._ensureInAncestry(id2)
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
    this._ensureInAncestry(id1)
    this._ensureInAncestry(id2)
    return predicate != null
      ? this._furthestCommonAncestorWithPredicate(id1, id2, predicate)
      : this._furthestCommonAncestorNoPredicate(id1, id2)
  }

  /**
   * Finds the closes ancestor that matches the predicate.
   * If two ancestors match the predicate and have the same distance, the
   * first one found is returned.
   *
   * Therefore this function is non-deterministic since it depends on the order
   * in which ancestors were added.
   *
   * @name grama.closestAncestor
   * @function
   * @param {String|Number} id the id of the node whose ancestors to evaluate
   * @param {Function} predicate a function that needst to return `true` if the
   * ancestor satisfies the criteria
   * @return {String|Number} the id of the first ancestor matching the predicate
   */
  closestAncestor(id, predicate) {
    this._ensureInAncestry(id)
    // Relies on the fact that we sorted the ancestors by distance,
    // smallest to greatest (@see _buildAncestry)
    const a = this._ancestry.get(id)
    for (const id of a.ancestors.keys()) {
      if (predicate(id)) return id
    }
    return null
  }

  /**
   * Finds all ancestors that match the predicate.
   *
   * @name grama.allAncestors
   * @function
   * @param {String|Number} id the id of the node whose ancestors to evaluate
   * @param {Function} predicate a function that needst to return `true` if the
   * ancestor satisfies the criteria
   * @return {Set.<String|Number>} the ids of all ancestors matching the predicate
   */
  allAncestors(id, predicate) {
    this._ensureInAncestry(id)
    const matches = new Set()
    const a = this._ancestry.get(id)
    for (const id of a.ancestors.keys()) {
      if (predicate(id)) matches.add(id)
    }
    return matches
  }

  /**
   * Finds the closes descendant that matches the predicate.
   * If two descendants match the predicate and have the same distance, the
   * first one found is returned.
   *
   * Therefore this function is non-deterministic since it depends on the order
   * in which descendants were added.
   *
   * @name grama.closestDescendant
   * @function
   * @param {String|Number} id the id of the node whose descendants to evaluate
   * @param {Function} predicate a function that needst to return `true` if the
   * descendant satisfies the criteria
   * @return {String|Number} the id of the first descendant matching the predicate
   */
  closestDescendant(id, predicate) {
    this._ensureInAncestry(id)
    // Relies on the fact that we sorted the descendants by distance,
    // smallest to greatest (@see _buildAncestry)
    const a = this._ancestry.get(id)
    for (const id of a.descendants.keys()) {
      if (predicate(id)) return id
    }
    return null
  }

  /**
   * Finds all descendants that match the predicate.
   *
   * @name grama.allDescendants
   * @function
   * @param {String|Number} id the id of the node whose descendants to evaluate
   * @param {Function} predicate a function that needst to return `true` if the
   * descendant satisfies the criteria
   * @return {Set.<String|Number>} the ids of all descendants matching the predicate
   */
  allDescendants(id, predicate) {
    this._ensureInAncestry(id)
    const matches = new Set()
    const a = this._ancestry.get(id)
    for (const id of a.descendants.keys()) {
      if (predicate(id)) matches.add(id)
    }
    return matches
  }

  /**
   * Finds the closest sibling to the node with the provided id that matches the predicate.
   *
   * It's not exactly a sibling but any node that is a descendant of an
   * ancestor of the node with the provided `id`.
   *
   * We consider the siblings closest if the distance from the node at `id` to
   * the common ancestor is shortest.
   *
   * For instance in the example below we are trying to find the closest sibling of WriteStream:Close.
   * Our predicate looks for anything that is a `WriteStream:Write`.
   *
   * `WriteStream:Write2` is considered a closer sibling since the common ancestor `Read2` is at a shorter
   * distance to `WriteStream:Close` than `Read1` which is the ancestor of the other `WriteStream:Write1`.
   *
   * ```
   *            -- ReadStream:Open -- Read1 -- Read2 -- Read3 -- WriteStream:Close
   *          /                           \          \
   * Parent                                \           -- WriteStream:Write2
   *          \                              -- WriteStream:Write1
   *            -- WriteStream:Open
   * ```
   *
   * @name grama.closestSibling
   * @function
   * @param {String|Number} id the id of the node whose closest sibling we are trying to find
   * @param {Function} predicate needs to return `true` in order to determine a node as a sibling,
   *  it is invoked with `({ descendantId, descendantDistance, ancestorId, ancestorDistance })`.
   * @return {String|Number} the id of the closest sibling matching the predicate
   */
  closestSibling(id, predicate) {
    this._ensureInAncestry(id)
    const a = this._ancestry.get(id)
    // Walk up the ancestors of the given node and then evaluate if any of its descendants
    // is a worthy sibling
    for (const [ ancestorId, ancestorDistance ] of a.ancestors) {
      if (!this._ancestry.has(ancestorId)) continue
      const ancestor = this._ancestry.get(ancestorId)
      for (const [ descendantId, descendantDistance ] of ancestor.descendants) {
        // don't match myself ;)
        if (descendantId  === id) continue
        if (predicate({ descendantId, descendantDistance, ancestorId, ancestorDistance })) return descendantId
      }
    }
    return null
  }

  /**
   * Finds the all siblings to the node with the provided id that match the predicate.
   *
   * It's not exactly a sibling but any node that is a descendant of an
   * ancestor of the node with the provided `id`.
   *
   * For instance in the example below we are trying to find all siblings to
   * `WriteStream:Close` that start with `WriteStream`.
   * The result would include `WriteStream:Write2`, `WriteStream:Write1` and `WriteStream:Open`.
   *
   * ```
   *            -- ReadStream:Open -- Read1 -- Read2 -- Read3 -- WriteStream:Close
   *          /                           \          \
   * Parent                                \           -- WriteStream:Write2
   *          \                              -- WriteStream:Write1
   *            -- WriteStream:Open
   * ```
   *
   * @name grama.allSiblings
   * @function
   * @param {String|Number} id the id of the node whose siblings we are trying to find
   * @param {Function} predicate needs to return `true` in order to determine a node as a sibling,
   *  it is invoked with `({ descendantId, descendantDistance, ancestorId, ancestorDistance })`.
   * @return {Set.<String|Number>} the ids of the siblings matching the predicate
   */
  allSiblings(id, predicate) {
    this._ensureInAncestry(id)
    const siblings = new Set()
    const a = this._ancestry.get(id)
    for (const [ ancestorId, ancestorDistance ] of a.ancestors) {
      if (!this._ancestry.has(ancestorId)) continue
      const ancestor = this._ancestry.get(ancestorId)
      for (const [ descendantId, descendantDistance ] of ancestor.descendants) {
        if (descendantId  === id) continue
        if (predicate({ descendantId, descendantDistance, ancestorId, ancestorDistance })) {
          siblings.add(descendantId)
        }
      }
    }
    return siblings
  }

  /**
   * Determines if the given id is part of the nodes that were passed to grama.
   *
   * @name grama.has
   * @function
   * @param {String|Number} id the id we are verifying
   * @return {Boolean} `true` if so otherwise `false`
   */
  has(id) {
    return this._nodes.has(id)
  }

  /**
   * Retrieves the node with the given id from the nodes that were passed to grama.
   *
   * @name grama.get
   * @function
   * @param {String|Number} id the id we are trying to get
   * @return {Object} the node with the supplied id or `null` if not found
   */
  get(id) {
    return this._nodes.get(id)
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
