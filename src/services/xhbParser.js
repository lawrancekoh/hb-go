export const xhbParser = {
  parse: (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Extract Categories
    const catNodes = xmlDoc.getElementsByTagName("cat");
    const categories = [];
    for (let i = 0; i < catNodes.length; i++) {
      const name = catNodes[i].getAttribute("name");
      const parent = catNodes[i].getAttribute("parent");
      // If it has a parent, we might want to map it?
      // For now just list names. Or if parent exists, maybe construct full path?
      // HomeBank usually flattens or uses ID. But CSV import expects text.
      // If we can get a list of all categories, that's good.
      // The parent attribute refers to the key of another cat.
      categories.push({
        key: catNodes[i].getAttribute("key"),
        name: name,
        parent: parent
      });
    }

    // Helper function to resolve full path recursively
    const getFullPath = (cat, allCats) => {
        if (cat.parent) {
            const parentCat = allCats.find(c => c.key === cat.parent);
            if (parentCat) {
                return `${getFullPath(parentCat, allCats)}:${cat.name}`;
            }
        }
        return cat.name;
    };

    // Resolve category hierarchy
    const resolvedCategories = categories.map(cat => getFullPath(cat, categories)).sort();

    // Extract Payees
    const payNodes = xmlDoc.getElementsByTagName("pay");
    const payees = [];
    for (let i = 0; i < payNodes.length; i++) {
      payees.push(payNodes[i].getAttribute("name"));
    }

    // Extract Tags
    const tagNodes = xmlDoc.getElementsByTagName("tag");
    const tags = [];
    for (let i = 0; i < tagNodes.length; i++) {
      const tagName = tagNodes[i].getAttribute("name");
      if (tagName) tags.push(tagName);
    }
    // Save to LocalStorage
    localStorage.setItem('hb_tags', JSON.stringify(tags));

    return {
      categories: resolvedCategories,
      payees: payees.sort(),
      tags: tags.sort()
    };
  }
};
