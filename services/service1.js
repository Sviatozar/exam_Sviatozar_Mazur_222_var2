const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');
const path = require('path');

const app = express();
const PORT = process.env.SERVICE_PORT || 3001;
const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let connection;
let channel;
let clients = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/web1.html'));
});

app.post('/connect', async (req, res) => {
  try {
    if (!connection) {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      const exchange = 'events';
      const queue = 'service1_queue';
      
      await channel.assertExchange(exchange, 'topic', { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, 'user.*');

      channel.consume(queue, (msg) => {
        if (msg) {
          const content = msg.content.toString();
          console.log('Received:', content);
          
          clients.forEach(client => {
            client.write(`data: ${JSON.stringify({ message: content })}\n\n`);
          });
          
          channel.ack(msg);
        }
      });

      console.log('Service 1 connected to RabbitMQ');
    }
    
    res.json({ status: 'connected', service: 'service1' });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/send', async (req, res) => {
  try {
    const { routingKey, message } = req.body;
    
    if (!channel) {
      return res.status(500).json({ error: 'Not connected to RabbitMQ' });
    }

    const exchange = 'events';
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const msg = {
      content: message,
      timestamp: new Date().toISOString(),
      source: 'service1'
    };

    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)));
    console.log(`Message published to ${routingKey}:`, message);
    
    res.json({ status: 'sent', routingKey, message });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/listen', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  clients.push(res);

  res.write('data: {"message":"Connected to message stream"}\n\n');

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

process.on('SIGINT', async () => {
  console.log('Shutting down service 1...');
  if (connection) {
    await connection.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Service 1 listening on http://localhost:${PORT}`);
});
