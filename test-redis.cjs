require("dotenv").config();

const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("❌ REDIS_URL missing from .env file");
  process.exit(1);
}

const client = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 15000,
    reconnectStrategy: false,
  },
});

client.on("error", (err) => {
  console.error("Redis client error:", err.message);
});

async function testRedis() {
  try {
    console.log("🔌 Connecting to Redis...");

    await client.connect();
    console.log("✅ Redis connected!");

    const ping = await client.ping();
    console.log("PING response:", ping);

    await client.set("vscode_test", "Connection successful");

    const value = await client.get("vscode_test");
    console.log("Read test:", value);

    if (value === "Connection successful") {
      console.log("🎉 Redis read/write test passed!");
    } else {
      console.log("❌ Redis read/write test failed!");
    }
  } catch (err) {
    console.error("\n❌ Redis connection failed");
    console.error("Error code:", err.code || "Not provided");
    console.error("Error message:", err.message);

    if (err.cause) {
      console.error("Error cause:", err.cause.message || err.cause);
    }
  } finally {
    if (client.isOpen) {
      try {
        await client.quit();
      } catch {
        client.destroy();
      }
    }

    console.log("Test finished.");
  }
}

testRedis();