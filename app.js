let express = require('express');
let app = express();
let path = require('path');
let util = require('util');
let request = require('request')

const port = process.argv[3] || 8096;

const hosts = {
  lo: 'http://127.0.0.1:8096',
  bo4: 'http://172.26.25.122:8096'
}

const proxyTarget = hosts[process.argv[2]] || hosts['lo']
console.log(`using ${proxyTarget} as proxy target`)

app.use((req, res) => {
  let { method, originalUrl, headers } = req
  console.log(`proxying \x1b[36m${method} ${originalUrl} to ${proxyTarget}`)
  printHeaders(headers)
  let body = ''
  req.on('data', (data) => {
    body += data
  })
  req.on('end', () => {
    console.log(`${body}\x1b[0m`)
    request({
      url: proxyTarget + originalUrl, method, body, headers
    })
      .on('response', (res) => {
        console.log(`response \x1b[33m${res.statusCode} ${res.request.path}`)
        res.rawBody = ''
        res.on('data', (data) => {
          res.rawBody += data
        })
        res.on('end', () => {
          printHeaders(res.headers)
          console.log(`${JSON.stringify(JSON.parse(res.rawBody), null, 2)}`)
          console.log('\x1b[0m');
        })
      })
      .on('error', (error) => {
        console.log(`ACHTUNG: ${error}`)
      })
      .pipe(res)
  })
})

app.listen(port, () => console.log(`app listening on port ${port}`))

let printHeaders = (headers, dest = console.log) => {
  Object.keys(headers).forEach((key) => {
    dest(`  ${key}: ${headers[key]}`);
  });
}