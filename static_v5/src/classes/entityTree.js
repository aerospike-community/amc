function toUDF(cluster) {
  let udfs = {
    id: cluster.id + '_UDF',
    name: 'UDF',
    children: []
  };

  cluster.modules.forEach((udf) => {
    let c = Object.assign({}, udf, {
      id: udf.hash,
      children: []
    });
    udfs.children.push(c);
  });

  return udfs;
}

function toNodes(cluster) {
  let nodes = {
    id: cluster.id + '_Nodes',
    name: 'Nodes',
    children: []
  };

  cluster.nodes.forEach((node) => {
    let n = Object.assign({}, node, {
      id: node.host,
      children: [],
      name: node.host
    });
    if (Array.isArray(n.namespaces))
      n.children.push(toNamespaces(n));

    nodes.children.push(n);
  });

  return nodes;
}

function toNamespaces(node) {
  let namespaces = {
    id: node.id + '_Namespaces',
    name: 'Namespaces',
    children: []
  };

  node.namespaces.forEach((namespace) => {
    let ns = Object.assign({}, namespace, {
      id: node.id + '_' + namespace.name,
      children: [],
      node: node.host,
    });
    if (Array.isArray(ns.sets))
      ns.children.push(toSets(ns));
    namespaces.children.push(ns);
  });
  return namespaces;
}

function toSets(namespace) {
  let sets = {
    id: namespace.id + '_Sets',
    name: 'Sets',
    children: []
  };

  namespace.sets.forEach((set) => {
    let s = Object.assign({}, set, {
      id: namespace.id + '_' + set.name,
      children: [],
      node: namespace.node,
      namespace: namespace.name,
    });
    sets.children.push(s);
  });
  return sets;
}
  
export function toPhysicalEntityTree(cluster) {
  let root = {
    entityType: 'cluster',
    id: cluster.id,
    name: cluster.name,
    isAuthenticated: cluster.isAuthenticated,
    children: [],
  };

  if (!cluster.isAuthenticated)
    return root;

  let children = [];
  if (Array.isArray(cluster.modules)) {
    children.push(toUDF(cluster));
  }
  if (Array.isArray(cluster.nodes)) {
    children.push(toNodes(cluster));
  }

  root.children = children;
  return root;
}

