const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
  } catch (err) {
    console.error('Redis Connection Failed:', err);
  }
};

module.exports = { client, connectRedis };

