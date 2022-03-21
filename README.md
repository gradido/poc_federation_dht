# Proof of Concept - Federation using DHT

This repository shall explore our possibilities to get in touch with external communities using DHT.
We utilize the [@hyperswarm/dht](https://github.com/hyperswarm/dht) package for this.

The goal is to connect all peers and exchange a list of API endpoints together with a public key for the corresponding community instance.

The application must generate new keys on startup to allow the spawning of multiple communities easily.

This is also an test if this library is compatible with typescript
