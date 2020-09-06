const domainRegex = /^(?:https?:?\/\/)([^/?]*)/i
function getDomain (url) {
  if (url == null || url.match == null) return null
  var domainMatch = url.match(domainRegex)
  var domain = null
  if (domainMatch && domainMatch.length) {
    domain = domainMatch[1]
  }
  return domain
}

export { getDomain }
