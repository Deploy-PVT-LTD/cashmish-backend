import { MongoClient } from 'mongodb';

async function migrate() {
    // Correct direct connection URIs
    const oldUri = 'mongodb://waqaskhokhar2002_db_user:deploy123@ac-i5q7qjq-shard-00-00.fj5c5ag.mongodb.net:27017,ac-i5q7qjq-shard-00-01.fj5c5ag.mongodb.net:27017,ac-i5q7qjq-shard-00-02.fj5c5ag.mongodb.net:27017/resell?ssl=true&replicaSet=atlas-wtsp8n-shard-0&authSource=admin&retryWrites=true&w=majority';
    const newUri = 'mongodb://mobilizegear_db_user:Aryan09@ac-7s6uoxd-shard-00-00.ovw0e4o.mongodb.net:27017,ac-7s6uoxd-shard-00-01.ovw0e4o.mongodb.net:27017,ac-7s6uoxd-shard-00-02.ovw0e4o.mongodb.net:27017/cashmish?ssl=true&replicaSet=atlas-vch3vt-shard-0&authSource=admin&retryWrites=true&w=majority';

    console.log('Connecting to Source DB (Old)...');
    const oldClient = new MongoClient(oldUri);
    await oldClient.connect();
    const oldDb = oldClient.db('resell');
    console.log('Connected to Source DB.');

    console.log('Connecting to Target DB (New)...');
    const newClient = new MongoClient(newUri);
    await newClient.connect();
    const newDb = newClient.db('cashmish');
    console.log('Connected to Target DB.');

    try {
        const collections = await oldDb.listCollections().toArray();
        console.log(`Found ${collections.length} collections in source DB.`);

        for (let colInfo of collections) {
            const colName = colInfo.name;
            if (colName.startsWith('system.')) continue;

            const oldCol = oldDb.collection(colName);
            const newCol = newDb.collection(colName);

            console.log(`Migrating collection: ${colName}...`);
            const docs = await oldCol.find({}).toArray();

            if (docs.length > 0) {
                try {
                    await newCol.drop();
                    console.log(` -> Dropped existing collection: ${colName}`);
                } catch (e) { }

                await newCol.insertMany(docs);
                console.log(` -> Successfully migrated ${docs.length} documents.`);
            } else {
                console.log(` -> Collection ${colName} is empty. Skipping.`);
            }
        }
        console.log('\nMigration completed successfully!');
    } catch (err) {
        console.error('\n!!! Migration failed:', err);
    } finally {
        await oldClient.close();
        await newClient.close();
        console.log('Connections closed.');
    }
}

migrate();
