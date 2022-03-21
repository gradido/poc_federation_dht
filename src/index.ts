import DHT from "@hyperswarm/dht";
import { between } from "./utils/between";

const TOPIC = DHT.hash(Buffer.from("GRADIDO"));

const POLLTIME = 20000;
const SUCCESSTIME = 120000;
const ERRORTIME = 240000;
const nodeRand = between(1, 99);
const nodeURL = `https://test${nodeRand}.org`;
const nodeAPI = {
  API_1_00: `${nodeURL}/api/1_00/`,
  API_1_01: `${nodeURL}/api/1_01/`,
  API_2_00: `${nodeURL}/graphql/2_00/`,
};

const main = async () => {
  // make a ed25519 keypair to listen on
  const keyPair = DHT.keyPair();

  console.log("I am:", keyPair.publicKey.toString("hex"), nodeAPI);

  const node = new DHT({ keyPair });

  // create a server to listen for secure connections
  const server = node.createServer();

  server.on("connection", function (socket) {
    // noiseSocket is E2E between you and the other peer
    // pipe it somewhere like any duplex stream
    console.log(
      "Remote public key",
      socket.remotePublicKey.toString("hex")
    );
    // console.log("Local public key", noiseSocket.publicKey.toString("hex")); // same as keyPair.publicKey

    socket.on('data', data => console.log('data:', data.toString('ascii')))

    // process.stdin.pipe(noiseSocket).pipe(process.stdout);
  });

  await server.listen();

  await node.announce(TOPIC, keyPair).finished();

  let successfulRequests = [];
  let errorfulRequests = [];

  setInterval(async () => {
    successfulRequests = [];
  }, SUCCESSTIME);

  setInterval(async () => {
    errorfulRequests = [];
  }, ERRORTIME);

  setInterval(async () => {
    const result = await node.lookup(TOPIC);

    const collectedPubKeys = [];

    for await (const data of result) {
      /* console.log(
        `${data.from.host}:${data.from.port}: peers: ${data.peers.length}`
      ); */
      data.peers.forEach((peer) => {
        const pubKey = peer.publicKey.toString("hex");
        if (
          pubKey !== keyPair.publicKey.toString("hex") &&
          !successfulRequests.includes(pubKey) &&
          !errorfulRequests.includes(pubKey) &&
          !collectedPubKeys.includes(pubKey)
        ) {
          collectedPubKeys.push(peer.publicKey.toString("hex"));
        }
      });
    }

    console.log('Found new peers: ', collectedPubKeys);

    collectedPubKeys.forEach((remotePubKey) => {
      // publicKey here is keyPair.publicKey from above
      const socket = node.connect(Buffer.from(remotePubKey, "hex"));

      /* socket.once("connect", function () {
        console.log("client side emitted connect");
      }); */

      /* socket.once("end", function () {
        console.log("client side ended");
      }); */

      socket.once("error", (err) => {
        errorfulRequests.push(remotePubKey);
        console.log(`error on peer ${remotePubKey}: ${err.message}`);
      });

      socket.on("open", function () {
        // noiseSocket fully open with the other peer
        // console.log("writing to socket");
        socket.write(Buffer.from(`${nodeRand}`));
        socket.write(Buffer.from(JSON.stringify(nodeAPI)));
        successfulRequests.push(remotePubKey);
      });
      // pipe it somewhere like any duplex stream
      // process.stdin.pipe(noiseSocket).pipe(process.stdout)
    });
  }, POLLTIME);

  // node.destroy()
  // await node.unannounce(TOPIC, keyPair);
};

main();
