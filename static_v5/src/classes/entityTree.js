import { VIEW_TYPE } from 'classes/constants';
import { toEntityPath } from 'classes/urlAndViewSynchronizer';

// Each entity is uniquely identified by the path from its cluster.
// 'path' is defined by the entities it encounters on its traversal 
// from the cluster root.
//
// Example: clusterID/NODES/nodeHost/NAMESPACES/namespaceName
//

export function toUDFOverviewPath(clusterID) {
  return toEntityPath(VIEW_TYPE.UDF_OVERVIEW, {
    clusterID: clusterID
  });
}

export function toUDFPath(clusterID, udfName) {
  return toEntityPath(VIEW_TYPE.UDF, {
    clusterID: clusterID,
    udfName: udfName
  });
}

function toUDF(cluster) {
  const path = toUDFOverviewPath(cluster.id);
  let udfs = {
    path: path,
    name: 'UDF',
    children: [],
    isCategory: true, // aggregator of entites
    viewType: VIEW_TYPE.UDF_OVERVIEW,
  };

  if (!Array.isArray(cluster.modules)) 
    return udfs;

  cluster.modules.forEach((udf) => {
    const path = toUDFPath(cluster.id, udf.name);
    let c = Object.assign({}, udf, {
      path: path,
      children: [],
      viewType: VIEW_TYPE.UDF,
    });
    udfs.children.push(c);
  });

  return udfs;
}

export function toNodeOverviewPath(clusterID) {
  return toEntityPath(VIEW_TYPE.NODE_OVERVIEW, {
    clusterID: clusterID,
  });
}

export function toNodePath(clusterID, nodeHost) {
  return toEntityPath(VIEW_TYPE.NODE, {
    clusterID: clusterID,
    nodeHost: nodeHost
  });
}

function toNodes(cluster) {
  const path = toNodeOverviewPath(cluster.id);
  let nodes = {
    path: path,
    name: 'NODES',
    children: [],
    isCategory: true, // aggregator of entities
    viewType: VIEW_TYPE.NODE_OVERVIEW,
  };

  if (!Array.isArray(cluster.nodes)) 
    return nodes;

  cluster.nodes.forEach((node) => {
    const path = toNodePath(cluster.id, node.host);
    let n = Object.assign({}, node, {
      path: path,
      children: [],
      name: node.host,
      viewType: VIEW_TYPE.NODE,
    });
    if (Array.isArray(n.namespaces))
      n.children.push(toNamespaces(cluster, node));

    nodes.children.push(n);
  });

  return nodes;
}

export function toNamespaceOverviewPath(clusterID, nodeHost) {
  return toEntityPath(VIEW_TYPE.NAMESPACE_OVERVIEW, {
    clusterID: clusterID,
    nodeHost: nodeHost
  });
}

export function toNamespacePath(clusterID, nodeHost, namespaceName) {
  return toEntityPath(VIEW_TYPE.NAMESPACE, {
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName
  });
}

function toNamespaces(cluster, node) {
  const path = toNamespaceOverviewPath(cluster.id, node.host);
  let namespaces = {
    path: path,
    name: 'NAMESPACES',
    children: [],
    isCategory: true, // aggregator of entities
    viewType: VIEW_TYPE.NAMESPACE_OVERVIEW,
  };

  node.namespaces.forEach((namespace) => {
    const path = toNamespacePath(cluster.id, node.host, namespace.name);
    let ns = Object.assign({}, namespace, {
      path: path,
      children: [],
      viewType: VIEW_TYPE.NAMESPACE,
    });
    if (Array.isArray(ns.sets))
      ns.children.push(toSets(cluster, node, namespace));
    namespaces.children.push(ns);
  });
  return namespaces;
}

export function toSetOverviewPath(clusterID, nodeHost, namespaceName) {
  return toEntityPath(VIEW_TYPE.SET_OVERVIEW, {
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
  });
}

export function toSetPath(clusterID, nodeHost, namespaceName, setName) {
  return toEntityPath(VIEW_TYPE.SET, {
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
    setName: setName,
  });
}

export function toIndexesOverviewPath(clusterID) {
  return toEntityPath(VIEW_TYPE.INDEXES_OVERVIEW, {
    clusterID: clusterID,
  });
}

export function toIndexPath(clusterID, indexName) {
  return toEntityPath(VIEW_TYPE.INDEX, {
    clusterID: clusterID,
    indexName: indexName
  });
}

function toIndexes(cluster) {
  const path = toIndexesOverviewPath(cluster.id);
  const indexes = {
    path: path,
    name: 'INDEXES',
    children: [],
    isCategory: true, // aggregator of entities
    viewType: VIEW_TYPE.INDEXES_OVERVIEW
  };

  if (!Array.isArray(cluster.indexes)) 
    return indexes;

  cluster.indexes.forEach((index) => {
    // FIXME remove this once the API is fixed
    const isPresent = indexes.children.find((ind) => ind.name === index.name);
    if (isPresent)
      return;

    const path = toIndexPath(cluster.id, index.name);
    let c = Object.assign({}, index, {
      path: path,
      children: [],
      viewType: VIEW_TYPE.INDEX,
    });
    indexes.children.push(c);
  });

  return indexes;
}

function toSets(cluster, node, namespace) {
  const path = toSetOverviewPath(cluster.id, node.host, namespace.name);
  let sets = {
    path: path,
    name: 'SETS',
    children: [],
    isCategory: true, // aggregator of entities
    viewType: VIEW_TYPE.SET_OVERVIEW,
  };

  namespace.sets.forEach((set) => {
    const path = toSetPath(cluster.id, node.host, namespace.name, set.name);
    let s = Object.assign({}, set, {
      path: path,
      children: [],
      viewType: VIEW_TYPE.SET,
    });
    sets.children.push(s);
  });
  return sets;
}
  
// convert the cluster into a physical entity tree representation
export function toPhysicalEntityTree(cluster) {
  const path = toClusterPath(cluster.id);
  let root = {
    path: path,
    name: cluster.name,
    isAuthenticated: cluster.isAuthenticated,
    children: [],
    isCategory: true, // aggregator of entities
    viewType: VIEW_TYPE.CLUSTER,
  };

  if (!cluster.isAuthenticated)
    return root;

  let children = [];
  children.push(toNodes(cluster));
  children.push(toUDF(cluster));
  children.push(toIndexes(cluster));

  root.children = children;
  return root;
}

// get cluster path
export function toClusterPath(clusterID) {
  return toEntityPath(VIEW_TYPE.CLUSTER, {
    clusterID: clusterID,
  });
}
