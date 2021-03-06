#!/usr/bin/env node
process.title = 'magnet'

const minimist = require('minimist')
const request = require('request')
const cheerio = require('cheerio')

const version = "magnet version: 0.1.1"
const help = `
Usage: magnet [--rows=N] query [index [-- pargs]]
       magnet [-v | --version]
       magnet [-h | --help]

Options:
  query     Search query
  index     Gets the magnet link for a particular item
  --rows=N  Number of query results to show
     --     Sends the magnet link to peerflix
  pargs     Arguments for peerflix (requires -p)
`
const baseUrl = 'https://thepiratebay.org'
const reqUrl = baseUrl+'/search/'

let argv = minimist(process.argv.slice(2), {'--': true})
if (argv.version || argv.v) {
  console.log(version)
  process.exit(0)
}
if (argv.help || argv.h || argv._.length < 1) {
  console.log(help)
  process.exit(0)
}

const query = argv._[0]
const url = reqUrl + encodeURIComponent(query)
const max = argv._[1] || argv.rows || 5
const min = argv._[1] || 1

function handle(rows) {
  if (argv._.length < 2) {
    for (const [index, row] of rows.entries()) {
      process.stdout.write(`${index+1}: ${row.name}\n`)
    }
  } else {
    const magnet = rows[0].url
    if (process.argv.indexOf('--') != -1) {
      let pargs = [magnet]
      pargs.push(...argv['--'])
      require('child_process').spawn('peerflix', pargs, { stdio: 'inherit' })
    } else {
      process.stdout.write(`${magnet}\n`)
    }
  }
}

request({
  url:  url,
  gzip: true,
}, (error, response, body) => {
  if (error) {
    console.error(error)
    return
  }
  let $ = cheerio.load(body)
  let rows = []
  $('tr>td:nth-child(2)', 'table#searchResult').filter((i) => min <= i && i <= max).each((i, row) => {
    rows[i] = {
      name:   $('.detName>a', row).text(),
      url:    $('a[href^=magnet]', row).attr('href')
    }
  })
  handle(rows)
})
