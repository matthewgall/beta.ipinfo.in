addEventListener('fetch', event => {
  event.respondWith(fetchAndRespond(event.request))
})

/**
 * Fetch and log a given request object
 * @param {Request} request
 */
async function fetchAndRespond(request) {

    let reqUrl = new URL(request.url).pathname

    data = {
      'success': true,
      'results': {
        'ip': request.headers.get('Cf-Connecting-Ip'),
        'headers': {}
      }
    }

    for (let entry of request.headers.entries()) {
      data['results']['headers'][entry[0]] = entry[1]
    }
    
    if (reqUrl == '/' || reqUrl == '/ip') {
      return new Response(data['results']['ip'], {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }
    if (reqUrl == '/headers') {
      resp = []

      for (let entry in data['results']['headers']) {
        resp.push(entry + ': ' + data['results']['headers'][entry])
      }
      
      return new Response(resp.join('\r\n'), {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }
}