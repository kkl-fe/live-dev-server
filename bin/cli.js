#!/usr/bin/env node

'use strict'
const execa = require('execa')
const path = require('path')

process.title = 'live-dev-server'

execa('node', [path.resolve(__dirname, '../lib/index.js')]).stdout.pipe(
  process.stdout
)
