/**
 * Query Database - Check what's actually stored
 * Helps verify the scraper is working correctly
 */

require('dotenv').config();
const { connectToDatabase, getDatabase } = require('./src/core/database');

async function queryDatabase() {
    console.log('🔍 Querying AI Documentation Database\n');
    console.log('='.repeat(60));
    console.log('');

    try {
        // Connect to database
        console.log('📊 Connecting to database...');
        await connectToDatabase();
        const db = getDatabase();

        if (!db.isConnected) {
            console.log('❌ Database not connected!');
            process.exit(1);
        }

        console.log('✅ Connected\n');

        // Get statistics
        console.log('📈 Database Statistics:');
        try {
            const stats = await db.getStats();
            console.log(`   Total databases: ${stats.totalDatabases}`);
            console.log(`   Total collections: ${stats.totalCollections}`);
            console.log(`   Total documents: ${stats.totalDocuments}\n`);

            // Show details by database
            if (stats.databases && stats.databases.length > 0) {
                console.log('📚 Databases:\n');
                for (const dbInfo of stats.databases) {
                    console.log(`   ${dbInfo.company} (${dbInfo.name})`);
                    console.log(`      Total documents: ${dbInfo.totalDocuments}`);

                    if (dbInfo.collections && dbInfo.collections.length > 0) {
                        console.log('      Collections:');
                        dbInfo.collections.forEach(col => {
                            console.log(`         - ${col.name}: ${col.documentCount} documents`);
                        });
                    }
                    console.log('');
                }
            } else {
                console.log('   ⚠️  No data found in database yet\n');
                console.log('   Run the scraper first: npm run ai:demo\n');
            }

        } catch (error) {
            console.log(`   ⚠️  Could not fetch stats: ${error.message}\n`);
        }

        // Try to get some sample data
        console.log('📝 Sample Data:\n');

        try {
            // Try OpenAI GPT-4
            const gpt4Chunks = await db.getChunks('OpenAI', 'GPT-4');
            if (gpt4Chunks.length > 0) {
                console.log(`   OpenAI GPT-4: ${gpt4Chunks.length} chunks`);
                const sample = gpt4Chunks[0];
                console.log(`      First chunk ID: ${sample.id}`);
                console.log(`      Text preview: ${sample.text.substring(0, 100)}...`);
                console.log(`      Categories: ${sample.metadata.policyCategories.join(', ')}\n`);
            } else {
                console.log('   OpenAI GPT-4: No chunks found\n');
            }
        } catch (error) {
            console.log(`   OpenAI GPT-4: ${error.message}\n`);
        }

        try {
            // Try Anthropic Claude
            const claudeChunks = await db.getChunks('Anthropic', 'Claude 4');
            if (claudeChunks.length > 0) {
                console.log(`   Anthropic Claude 4: ${claudeChunks.length} chunks`);
                const sample = claudeChunks[0];
                console.log(`      First chunk ID: ${sample.id}`);
                console.log(`      Text preview: ${sample.text.substring(0, 100)}...`);
                console.log(`      Categories: ${sample.metadata.policyCategories.join(', ')}\n`);
            } else {
                console.log('   Anthropic Claude 4: No chunks found\n');
            }
        } catch (error) {
            console.log(`   Anthropic Claude 4: ${error.message}\n`);
        }

        // Check for failed scrapes
        console.log('❌ Failed Scrapes:\n');
        try {
            if (db.client) {
                const failureDb = db.client.db('ai_docs_scraper');
                const failedCount = await failureDb.collection('failed_scrapes').countDocuments();
                console.log(`   Total failed: ${failedCount}`);

                if (failedCount > 0) {
                    const failures = await failureDb.collection('failed_scrapes').find().limit(5).toArray();
                    console.log(`\n   Recent failures:`);
                    failures.forEach(f => {
                        console.log(`      - ${f.url}`);
                        console.log(`        Error: ${f.error}`);
                        console.log(`        Time: ${f.timestamp}`);
                    });
                }
            }
            console.log('');
        } catch (error) {
            console.log(`   Could not check failures: ${error.message}\n`);
        }

        console.log('='.repeat(60));
        console.log('');

    } catch (error) {
        console.error('❌ Query failed:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

// Run query
queryDatabase();
