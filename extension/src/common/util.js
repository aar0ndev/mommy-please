const domainRegex = /^(?:https?:?\/\/)([^/?]*)/i

/**
 * Retrieve domain for supplied `url`.
 * @param {string} url
 * @returns {string} domain part of url as string
 */
export function getDomain (url) {
  if (url == null || url.match == null) return null
  var domainMatch = url.match(domainRegex)
  var domain = null
  if (domainMatch && domainMatch.length) {
    domain = domainMatch[1]
  }

  // treat www.<whitelisted domain> specially
  if (domain && domain.startsWith('www.')) {
    domain = domain.slice(4)
  }

  return domain
}

/**
 * Convert the supplied time (in hours) to a timestamp. If `hours` is negative, return -1 indicating infinity.
 * @param {number} hours
 * @returns {number} milliseconds from epoch or -1
 */
export function getTimestampFromHours (hours) {
  var timestamp = Date.now() + 1000
  if (hours !== undefined) {
    if (hours < 0) {
      timestamp = -1
    } else {
      timestamp += Math.round(hours * 3600 * 1000)
    }
  }
  return timestamp
}
