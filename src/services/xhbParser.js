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

    // Resolve category hierarchy
    const resolvedCategories = categories.map(cat => {
        if(cat.parent) {
            const parentCat = categories.find(c => c.key === cat.parent);
            if(parentCat) {
                return `${parentCat.name}:${cat.name}`;
            }
        }
        return cat.name;
    }).sort();

    // Extract Payees
    const payNodes = xmlDoc.getElementsByTagName("pay");
    const payees = [];
    for (let i = 0; i < payNodes.length; i++) {
      payees.push(payNodes[i].getAttribute("name"));
    }

    return {
      categories: resolvedCategories,
      payees: payees.sort()
    };
  }
};
