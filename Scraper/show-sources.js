/**
 * Show all configured AI documentation sources
 */

const { aiDocumentationSources, getStats, getAllCompanies } = require('./src/config/aiDocsConfig');

console.log('\n📚 AI Documentation Sources Configuration\n');
console.log('═'.repeat(80));

// Show statistics
const stats = getStats();
console.log('\n📊 Overview:');
console.log(`   Total Sources: ${stats.totalSources}`);
console.log(`   Companies: ${stats.totalCompanies}`);
console.log(`   Models: ${stats.totalModels}`);
console.log(`   Priority Distribution:`);
console.log(`     • High (1): ${stats.byPriority.high} sources`);
console.log(`     • Medium (2): ${stats.byPriority.medium} sources`);
console.log(`     • Low (3): ${stats.byPriority.low} sources`);

console.log('\n🏢 Companies:');
stats.companies.forEach((company, i) => {
    const companySources = aiDocumentationSources.filter(s => s.company === company);
    console.log(`   ${i + 1}. ${company} (${companySources.length} sources)`);
});

console.log('\n' + '═'.repeat(80));
console.log('\n📄 All Sources:\n');

// Group by company
getAllCompanies().forEach((company, companyIndex) => {
    const companySources = aiDocumentationSources.filter(s => s.company === company);

    console.log(`\n${companyIndex + 1}. ${company.toUpperCase()} (${companySources.length} sources)`);
    console.log('   ' + '-'.repeat(76));

    companySources.forEach((source, i) => {
        console.log(`   ${i + 1}. ${source.model}`);
        console.log(`      Type: ${source.documentType} | Format: ${source.format} | Priority: ${source.priority}`);
        console.log(`      URL: ${source.url}`);
        console.log(`      Categories: ${source.policyCategories.join(', ')}`);
        if (i < companySources.length - 1) console.log('');
    });
});

console.log('\n' + '═'.repeat(80));
console.log('\n✅ Configuration loaded from: src/config/aiDocsConfig.js');
console.log('💡 Use npm run ai:start to begin scraping\n');
