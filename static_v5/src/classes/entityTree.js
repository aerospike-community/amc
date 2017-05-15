import { VIEW_TYPE } from './constants';
import { toEntityPath } from './urlAndViewSynchronizer';

// Each entity is uniquely identified by the path from its cluster.
// 'path' is defined by the entities it encounters on its traversal 
// from the cluster root.
//
// Example: clusterID/NODES/nodeHost/NAMESPACES/namespaceName
//
// NOTE: the paths generated should match the entity paths
// defined in urlAndViewSynchronizer

function toUDF(cluster) {
  const path = toEntityPath(VIEW_TYPE.UDF_OVERVIEW, {
    clusterID: cluster.id,
  });
  let udfs = {
    path: path,
    name: 'UDF',
    children: [],
    isCategory: true, // aggregator of entites
  };

  cluster.modules.forEach((udf) => {
    const path = toEntityPath(VIEW_TYPE.UDF, {
      clusterID: cluster.id,
      udfName: udf.name
    });
    let c = Object.assign({}, udf, {
      path: path,
      children: []
    });
    udfs.children.push(c);
  });

  return udfs;
}

function toNodes(cluster) {
  const path = toEntityPath(VIEW_TYPE.NODE_OVERVIEW, {
    clusterID: cluster.id,
  });
  let nodes = {
    path: path,
    name: 'Nodes',
    children: [],
    isCategory: true, // aggregator of entities
  };

  cluster.nodes.forEach((node) => {
    const path = toEntityPath(VIEW_TYPE.NODE, {
      clusterID: cluster.id,
      nodeHost: node.host
    });
    let n = Object.assign({}, node, {
      path: path,
      children: [],
      name: node.host,
    });
    if (Array.isArray(n.namespaces))
      n.children.push(toNamespaces(cluster, node));

    nodes.children.push(n);
  });

  return nodes;
}

function toNamespaces(cluster, node) {
  const path = toEntityPath(VIEW_TYPE.NAMESPACE_OVERVIEW, {
    clusterID: cluster.id,
    nodeHost: node.host
  });
  let namespaces = {
    path: path,
    name: 'Namespaces',
    children: [],
    isCategory: true, // aggregator of entities
  };

  node.namespaces.forEach((namespace) => {
    const path = toEntityPath(VIEW_TYPE.NAMESPACE, {
      clusterID: cluster.id,
      nodeHost: node.host,
      namespaceName: namespace.name,
    });
    let ns = Object.assign({}, namespace, {
      path: path,
      children: [],
    });
    if (Array.isArray(ns.sets))
      ns.children.push(toSets(cluster, node, namespace));
    namespaces.children.push(ns);
  });
  return namespaces;
}

function toSets(cluster, node, namespace) {
  const path = toEntityPath(VIEW_TYPE.SET_OVERVIEW, {
    clusterID: cluster.id,
    nodeHost: node.host,
    namespaceName: namespace.name,
  });
  let sets = {
    path: path,
    name: 'Sets',
    children: [],
    isCategory: true, // aggregator of entities
  };

  namespace.sets.forEach((set) => {
    const path = toEntityPath(VIEW_TYPE.SET, {
      clusterID: cluster.id,
      nodeHost: node.host,
      namespaceName: namespace.name,
      setName: set.name
    });
    let s = Object.assign({}, set, {
      path: path,
      children: [],
    });
    sets.children.push(s);
  });
  return sets;
}
  
// convert the cluster into a physical entity tree representation
export function toPhysicalEntityTree(cluster) {
  const path = toClusterPath(cluster);
  let root = {
    path: path,
    name: cluster.name,
    isAuthenticated: cluster.isAuthenticated,
    children: [],
    isCategory: true, // aggregator of entities
  };

  if (!cluster.isAuthenticated)
    return root;

  let children = [];
  if (Array.isArray(cluster.modules)) 
    children.push(toUDF(cluster));
  if (Array.isArray(cluster.nodes)) 
    children.push(toNodes(cluster));
  

  root.children = children;
  return root;
}

// get cluster path
export function toClusterPath(cluster) {
  return toEntityPath(VIEW_TYPE.CLUSTER, {
    clusterID: cluster.id,
  });
}
