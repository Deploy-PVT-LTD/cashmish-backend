import { MongoClient } from 'mongodb';

async function test() {
    const uri = 'mongodb://mobilizegear_db_user:Aryan09@ac-7s6uoxd-shard-00-00.ovw0e4o.mongodb.net:27017,ac-7s6uoxd-shard-00-01.ovw0e4o.mongodb.net:27017,ac-7s6uoxd-shard-00-02.ovw0e4o.mongodb.net:27017/cashmish?ssl=true&replicaSet=atlas-vch3vt-shard-0&authSource=admin';
    const client = new MongoClient(uri);
    try {
        console.log('Connecting to NEW DB (Direct)...');
        await client.connect();
        console.log('Successfully connected to the NEW DB!');
        const collections = await client.db('cashmish').listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } catch (e) {
        console.error('Connection failed:', e.message);
    } finally {
        await client.close();
    }
}

test();
