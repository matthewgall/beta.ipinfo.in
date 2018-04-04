addEventListener('fetch', event => {
  event.respondWith(fetchAndRespond(event.request))
})

/**
 * Fetch and log a given request object
 * @param {Request} request
 */
async function fetchAndRespond(request) {

    reqUrl = new URL(request.url).pathname
    
    data = {
      'success': true,
      'results': {
        'ip': request.headers.get('Cf-Connected-Ip')
      }
    }

    if (reqUrl == '/') {
      return new Response(data['results']['ip'], {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }
}