const TEXT_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8'
}
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
}
const ALLOWED_METHODS = ['GET', 'HEAD']

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
      const url = new URL(request.url)

      if (!ALLOWED_METHODS.includes(request.method)) {
        return respondError(request, url, 405, 'Method Not Allowed', {
          Allow: ALLOWED_METHODS.join(', ')
        })
      }

      const handler = routes[normalizePath(url.pathname)]

      if (!handler) {
        return respondError(request, url, 404, 'Not Found')
      }

      const response = await handler(request, url)

      if (request.method === 'HEAD') {
        return new Response(null, {
          status: response.status,
          headers: response.headers
        })
      }

      return response
    } catch (error) {
      return respondError(request, new URL(request.url), 500, 'Internal Server Error')
    }
  }
}

/**
 * @param {Request} request
 * @returns {Response}
 */
function handleIp(request, url) {
  const ip = getClientIp(request)

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
  const headers = Object.fromEntries(request.headers.entries())

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

/**
 * @param {Request} request
 * @param {URL} url
 * @param {number} status
 * @param {string} message
 * @param {Record<string, string>} extraHeaders
 * @returns {Response}
 */
function respondError(request, url, status, message, extraHeaders = {}) {
  const headers = wantsJson(request, url) ? JSON_HEADERS : TEXT_HEADERS
  const responseHeaders = {
    ...headers,
    ...extraHeaders
  }

  if (wantsJson(request, url)) {
    return new Response(
      JSON.stringify({
        error: {
          message
        }
      }),
      {
        status,
        headers: responseHeaders
      }
    )
  }

  return new Response(message, {
    status,
    headers: responseHeaders
  })
}

/**
 * @param {string} pathname
 * @returns {string}
 */
function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

/**
 * @param {Request} request
 * @returns {string}
 */
function getClientIp(request) {
  const cfConnectingIp = request.headers.get('Cf-Connecting-Ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  const forwardedFor = request.headers.get('X-Forwarded-For')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return ''
}
