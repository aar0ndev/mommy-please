const domainRegex = /^(?:https?:?\/\/)([^/?]*)/i
export function getDomain (url) {
  if (url == null || url.match == null) return null
  var domainMatch = url.match(domainRegex)
  var domain = null
  if (domainMatch && domainMatch.length) {
    domain = domainMatch[1]
  }
  return domain
}

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
