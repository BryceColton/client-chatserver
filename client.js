const net = require('net');
const EventEmitter = require("events");
const readline = require('readline');



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


const client = net.createConnection({ port: 6000 }, () => {
    console.log("got connected")
    rl.on('line', (input) => {
        client.write(input)
    })
})

client.setEncoding("utf-8")
client.on('data', data => {
    console.log(`Received: ${data.toString().trim()}`)
})

client.on('error', (err) => {
    console.log(`Client error: ${err.message}`)
})

client.on('end', () => {
    console.log('Disconnected from the server')
    rl.close()
})
