
import { xhbParser } from './xhbParser.js';
import { JSDOM } from 'jsdom';
import assert from 'assert';

// Mock DOMParser for Node.js environment
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    },
    removeItem: function(key) {
      delete store[key];
    }
  };
})();
global.localStorage = localStorageMock;

console.log('Running xhbParser tests...');

const xmlString = `
<homebank>
<cat key="1" name="GrandParent" />
<cat key="2" name="Parent" parent="1" />
<cat key="3" name="Child" parent="2" />
<cat key="4" name="Orphan" />
<tag name="Lunch" />
<tag name="Dinner" />
<tag name="Groceries" />
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

    // Test Tags
    const expectedTags = ["Lunch", "Dinner", "Groceries"].sort();
    const actualTags = result.tags.sort();
    assert.deepStrictEqual(actualTags, expectedTags);
    console.log('✅ Test Passed: Tags extracted correctly.');

    // Test LocalStorage
    const storedTags = JSON.parse(localStorage.getItem('hb_tags')).sort();
    assert.deepStrictEqual(storedTags, expectedTags);
    console.log('✅ Test Passed: Tags saved to localStorage.');

} catch (error) {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
}
