
import { xhbParser } from './xhbParser.js';
import { JSDOM } from 'jsdom';
import assert from 'assert';

// Mock DOMParser for Node.js environment
global.DOMParser = new JSDOM().window.DOMParser;

console.log('Running xhbParser tests...');

const xmlString = `
<homebank>
<cat key="1" name="GrandParent" />
<cat key="2" name="Parent" parent="1" />
<cat key="3" name="Child" parent="2" />
<cat key="4" name="Orphan" />
</homebank>
`;

try {
    const result = xhbParser.parse(xmlString);

    const expectedCategories = [
        "GrandParent",
        "GrandParent:Parent",
        "GrandParent:Parent:Child",
        "Orphan"
    ].sort();

    const actualCategories = result.categories.sort();

    assert.deepStrictEqual(actualCategories, expectedCategories);
    console.log('✅ Test Passed: Hierarchy correctly resolved.');
} catch (error) {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
}
