const InsightFacade = require('./dist/src/controller/InsightFacade.js').default;
const { InsightDatasetKind } = require('./dist/src/controller/IInsightFacade.js');
const fs = require('fs-extra');

async function debug() {
    const facade = new InsightFacade();
    
    // Load dataset
    const content = await fs.readFile('./test/resources/archives/pair.zip', 'base64');
    await facade.addDataset('sections', content, InsightDatasetKind.Sections);
    
    // Load query
    const query = await fs.readJson('./test/resources/queries/valid/simple.json');
    
    try {
        const result = await facade.performQuery(query.input);
        console.log('Result length:', result.length);
        console.log('First 3 results:', result.slice(0, 3));
        console.log('Expected first 3:', query.expected.slice(0, 3));
        
        // Check if arrays have same elements
        const resultStr = JSON.stringify(result.sort());
        const expectedStr = JSON.stringify(query.expected.sort());
        console.log('Arrays equal when sorted:', resultStr === expectedStr);
        
    } catch (err) {
        console.error('Error:', err.message);
    }
}

debug();