import { VIEW_TYPE } from './constants';

// Each entity is uniquely identified by the path from its cluster.
// 'path' is defined by the entities it encounters on its traversal 
// from the cluster root.
//
// Example: clusterID/NODES/nodeHost/NAMESPACES/namespaceName

export const CLUSTER = 'CLUSTER';
export const UDF = 'UDF';
export const NODES = 'NODES';
export const NAMESPACES = 'NAMESPACES';
export const SETS = 'SETS';

function toUDF(parentPath, cluster) {
  const path = parentPath + '/' + UDF;
  let udfs = {
    path: path,
    name: 'UDF',
    children: []
  };

  cluster.modules.forEach((udf) => {
    let c = Object.assign({}, udf, {
      path: path + '/' + udf.name,
      children: []
    });
    udfs.children.push(c);
  });

  return udfs;
}

function toNodes(parentPath, cluster) {
  const path = parentPath + '/' + NODES;
  let nodes = {
    path: path,
    name: 'Nodes',
    children: []
  };

  cluster.nodes.forEach((node) => {
    let npath = path + '/' + node.host;
    let n = Object.assign({}, node, {
      path: npath,
      children: [],
      name: node.host,
    });
    if (Array.isArray(n.namespaces))
      n.children.push(toNamespaces(npath, n));

    nodes.children.push(n);
  });

  return nodes;
}

function toNamespaces(parentPath, node) {
  const path = parentPath + '/' + NAMESPACES;
  let namespaces = {
    path: path,
    name: 'Namespaces',
    children: []
  };

  node.namespaces.forEach((namespace) => {
    let npath = path + '/' + namespace.name;
    let ns = Object.assign({}, namespace, {
      path: npath,
      children: [],
    });
    if (Array.isArray(ns.sets))
      ns.children.push(toSets(npath, ns));
    namespaces.children.push(ns);
  });
  return namespaces;
}

function toSets(parentPath, namespace) {
  const path = parentPath + '/' + SETS;
  let sets = {
    path: path,
    name: 'Sets',
    children: []
  };

  namespace.sets.forEach((set) => {
    let s = Object.assign({}, set, {
      path: path + '/' + set.name,
      children: [],
    });
    sets.children.push(s);
  });
  return sets;
}
  
export function toPhysicalEntityTree(cluster) {
  const path = cluster.id;
  let root = {
    path: path,
    name: cluster.name,
    isAuthenticated: cluster.isAuthenticated,
    children: [],
  };

  if (!cluster.isAuthenticated)
    return root;

  let children = [];
  if (Array.isArray(cluster.modules)) 
    children.push(toUDF(path, cluster));
  if (Array.isArray(cluster.nodes)) 
    children.push(toNodes(path, cluster));
  

  root.children = children;
  return root;
}

