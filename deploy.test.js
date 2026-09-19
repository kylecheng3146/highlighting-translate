const fs = require('fs');
const path = require('path');

describe('release package', () => {
    test('includes the dashboard runtime beside its HTML entry point', () => {
        const deployScript = fs.readFileSync(path.resolve(__dirname, 'deploy.sh'), 'utf8');
        const filesBlock = deployScript.match(/FILES=\(([\s\S]*?)\n\)/)?.[1] || '';

        expect(filesBlock).toContain('"dashboard.html"');
        expect(filesBlock).toContain('"dashboard.js"');
    });
});
