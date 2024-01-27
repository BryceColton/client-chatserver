const net = require('net');
const fs = require('fs');

const clients = [];
let clientIdCounter = 1;
const adminPassword = 'supersecretpw'; 
const server = net.createServer((socket) => {
  const clientId = clientIdCounter++;
  const username = `Guest${clientId}`; 
  clients.push({ id: clientId, socket, username});

  socket.write(`Welcome to the chat server Client: ${clientId}\n`);
  logToFile(`Client: ${clientId} connected\n`);


  clients.forEach((client) => {
    if (client.id !== clientId) {
      client.socket.write(`Client ${clientId} has joined the chat.\n`);

    }
  });

  socket.on('data', (data) => {
    const message = data.toString().trim();

    if (message.toLowerCase() === 'close') {
      socket.end();
      return;
    }
    clients.forEach((client) => {
        if (client.id !== clientId) {
          client.socket.write(`Client${clientId}: ${message}\n`);
        }
      });

    console.log(`Received data from Client ${clientId}: ${message}`);
    logToFile(`Client: ${clientId} ${message}\n`);


    const commandRegex = /^\/(\w+)(?:\s+(\w+)(?:\s+(.*))?)?$/;
    const match = message.match(commandRegex);
    const currentClient = clients.find((client) => client.socket === socket);


    if (match) {
      const command = match[1];
      const targetUsername = match[2];
      const additionalArgs = match[3];

      switch (command.toLowerCase()) {
        case 'w':
          handleWhisperCommand(currentClient, targetUsername, additionalArgs);
          break;

        case 'username':
          handleUsernameCommand(currentClient, targetUsername);
          break;

        case 'kick':
          handleKickCommand(currentClient, targetUsername, additionalArgs);
          break;

        case 'clientlist':
          handleClientListCommand(currentClient);
          break;

        default:
          console.log('Unknown command');
      }
    } else {
      console.log('Invalid command format');
    }
  });

  socket.on('end', () => {
    console.log(`Client ${clientId} disconnected`);
    clients.forEach((client) => {
      if (client.id !== clientId) {
        client.socket.write(`Client ${clientId} has left the chat.\n`);
      }
    });
    logToFile(`Client ${clientId} disconnected.\n`);
    clients.splice(clients.findIndex((client) => client.id === clientId), 1);
  });
})
  .listen(6000, () => {
    console.log('Server listening on port 6000');
  });

function logToFile(message) {
  fs.appendFile('chat.log', message, (err) => {
    if (err) {
      console.log("Error appending the chat.log")
    } else {
      console.log("Message appended to chat.log")
    }
  });
}

function handleWhisperCommand(sender, targetUsername, message) {
    const targetClient = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());
  
    if (!targetClient) {
      sender.socket.write(`Can't find ${targetUsername}\n`);
      return;
    }
  
    if (targetClient.id === sender.id) {
      sender.socket.write("don't whisper to yourself\n");
      return;
    }
  
    const whisperMessage = `Whisper from ${sender.username}: ${message}`;
    targetClient.socket.write(whisperMessage + '\n');
  }
  
  function handleUsernameCommand(client, newUsername) {
    let isUsernameTaken = false;

    clients.forEach((c) => {
      if (c.username.toLowerCase() === newUsername.toLowerCase()) {
        isUsernameTaken = true;
      }
    });  
    if (isUsernameTaken) {
      client.socket.write(`Error: Username '${newUsername}' is already in use.\n`);
      return;
    }
  
    if (client.username.toLowerCase() === newUsername.toLowerCase()) {
      client.socket.write("Error: New username is the same as the old username.\n");
      return;
    }
  
    const oldUsername = client.username;
    client.username = newUsername;
    client.socket.write(`Your username has been updated to '${newUsername}'.\n`);
  
    clients.forEach((otherClient) => {
      if (otherClient.id !== client.id) {
        otherClient.socket.write(`${oldUsername} is now known as ${newUsername}.\n`);
      }
    });
  }
  
  function handleKickCommand(sender, targetUsername, adminPasswordInput) {
    if (adminPasswordInput !== adminPassword) {
      sender.socket.write("Error: Incorrect admin password.\n");
      return;
    }
  
    const targetClient = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());
  
    if (!targetClient) {
      sender.socket.write(`Error: User '${targetUsername}' not found.\n`);
      return;
    }
  
    if (targetClient.id === sender.id) {
      sender.socket.write("Error: Cannot kick yourself.\n");
      return;
    }
  
    targetClient.socket.write("You have been kicked from the chat.\n");
    targetClient.socket.end();
  
}

function handleClientListCommand(currentClient) {
    const clientListString = clients.map(client => client.username).join(', ');
    const sender = currentClient
  
    if (sender) {
      sender.socket.write(`Connected clients: ${clientListString}\n`);
    } else {
      console.log('Sender not found');
    }
  }