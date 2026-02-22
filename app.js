const TEXT_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8'
}
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
}

/** @typedef {(request: Request, url: URL) => Promise<Response> | Response} RouteHandler */

/** @type {Record<string, RouteHandler>} */
const routes = {
  '/': handleIp,
  '/ip': handleIp,
  '/headers': handleHeaders
}

export default {
  /** @param {Request} request */
  async fetch(request) {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: TEXT_HEADERS
        })
      }

      const url = new URL(request.url)
      const handler = routes[url.pathname]

      if (!handler) {
        return new Response('Not Found', {
          status: 404,
          headers: TEXT_HEADERS
        })
      }

      return await handler(request, url)
    } catch (error) {
      return new Response('Internal Server Error', {
        status: 500,
        headers: TEXT_HEADERS
      })
    }
  }
}

/**
 * @param {Request} request
 * @returns {Response}
 */
function handleIp(request, url) {
  const ip = request.headers.get('Cf-Connecting-Ip') || ''

  if (wantsJson(request, url)) {
    return respondJson({
      ip
    })
  }

  return respondText(ip)
}

/**
 * @param {Request} request
 * @returns {Response}
 */
function handleHeaders(request, url) {
  const headers = {}
  const headerEntries = Array.from(request.headers.entries())

  for (const [key, value] of headerEntries) {
    headers[key] = value
  }

  if (wantsJson(request, url)) {
    return respondJson({
      headers
    })
  }

  const lines = Object.keys(headers)
    .sort()
    .map((key) => `${key}: ${headers[key]}`)

  return respondText(lines.join('\r\n'))
}

/**
 * @param {Request} request
 * @param {URL} url
 * @returns {boolean}
 */
function wantsJson(request, url) {
  const format = url.searchParams.get('format')
  if (format && format.toLowerCase() === 'json') {
    return true
  }

  const accept = request.headers.get('Accept') || ''
  return accept.includes('application/json')
}

/**
 * @param {string} body
 * @returns {Response}
 */
function respondText(body) {
  return new Response(body, {
    headers: TEXT_HEADERS
  })
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Response}
 */
function respondJson(payload) {
  return new Response(JSON.stringify(payload), {
    headers: JSON_HEADERS
  })
}