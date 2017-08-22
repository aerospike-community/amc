import { VIEW_TYPE } from 'classes/constants';

// the keys as defined in reducer/currentView
const Keys = {
  ClusterID: 'clusterID',
  Index:     'indexName',
  Node:      'nodeHost',
  Namespace: 'namespaceName',
  Set:       'setName',
  UDF:       'udfName',
};

function toUDF(cluster) {
  let udfs = {
    name: 'UDF',
    children: [],
    isCategory: true, // aggregator of entites

    [Keys.ClusterID]: cluster.id,
    viewType: VIEW_TYPE.UDF_OVERVIEW,
  };

  if (!Array.isArray(cluster.modules)) 
    return udfs;

  cluster.modules.forEach((udf) => {
    let c = Object.assign({}, udf, {
      children: [],

      [Keys.ClusterID]: cluster.id,
      [Keys.UDF]: udf.name,
      viewType: VIEW_TYPE.UDF,
    });

    udfs.children.push(c);
  });

  return udfs;
}

function toNodes(cluster) {
  let nodes = {
    name: 'NODES',
    children: [],
    isCategory: true, // aggregator of entities

    [Keys.ClusterID]: cluster.id,
    viewType: VIEW_TYPE.NODE_OVERVIEW,
  };

  if (!Array.isArray(cluster.nodes)) 
    return nodes;

  cluster.nodes.forEach((node) => {
    let n = Object.assign({}, node, {
      children: [],
      name: node.host,

      [Keys.ClusterID]: cluster.id,
      [Keys.Node]:  node.host,
      viewType: VIEW_TYPE.NODE,
    });
    if (Array.isArray(n.namespaces))
      n.children.push(toNamespaces(cluster, node));

    nodes.children.push(n);
  });

  return nodes;
}

function toNamespaces(cluster, node) {
  let namespaces = {
    name: 'NAMESPACES',
    children: [],
    isCategory: true, // aggregator of entities

    [Keys.ClusterID]: cluster.id,
    [Keys.Node]: node.host,
    viewType: VIEW_TYPE.NAMESPACE_OVERVIEW,
  };

  node.namespaces.forEach((namespace) => {
    let ns = Object.assign({}, namespace, {
      children: [],

      [Keys.ClusterID]: cluster.id,
      [Keys.Node]: node.host,
      [Keys.Namespace]: namespace.name,
      viewType: VIEW_TYPE.NAMESPACE,
    });

    if (Array.isArray(ns.sets))
      ns.children.push(toSets(cluster, node, namespace));
    namespaces.children.push(ns);
  });
  return namespaces;
}

function toIndexes(cluster) {
  const indexes = {
    name: 'INDEXES',
    children: [],
    isCategory: true, // aggregator of entities

    [Keys.ClusterID]: cluster.id,
    viewType: VIEW_TYPE.INDEXES_OVERVIEW
  };

  if (!Array.isArray(cluster.indexes)) 
    return indexes;

  cluster.indexes.forEach((index) => {
    // FIXME remove this once the API is fixed
    const isPresent = indexes.children.find((ind) => ind.name === index.name);
    if (isPresent)
      return;

    let c = Object.assign({}, index, {
      children: [],
      viewType: VIEW_TYPE.INDEX,

      [Keys.ClusterID]: cluster.id,
      [Keys.Index]: index.name,
    });

    indexes.children.push(c);
  });

  return indexes;
}

function toSets(cluster, node, namespace) {
  let sets = {
    name: 'SETS',
    children: [],
    isCategory: true, // aggregator of entities

    [Keys.ClusterID]: cluster.id,
    [Keys.Node]: node.host,
    [Keys.Namespace]: namespace.name,
    viewType: VIEW_TYPE.SET_OVERVIEW,
  };

  namespace.sets.forEach((set) => {
    let s = Object.assign({}, set, {
      children: [],

      [Keys.ClusterID]: cluster.id,
      [Keys.Node]: node.host,
      [Keys.Namespace]: namespace.name,
      [Keys.Set]: set.name,
      viewType: VIEW_TYPE.SET,
    });

    sets.children.push(s);
  });

  return sets;
}
  
// convert the cluster into a physical entity tree representation
export function toPhysicalEntityTree(cluster) {
  let root = {
    name: cluster.name,
    isAuthenticated: cluster.isAuthenticated,
    children: [],
    isCategory: true, // aggregator of entities

    viewType: VIEW_TYPE.CLUSTER,
    [Keys.ClusterID]: cluster.id,
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


// ----------------------------------------------------------------------------
// LOGICAL ENTITY TREE

function toLogicalNamespaces(cluster) {
  let namespaces = {
    name: 'NAMESPACES',
    children: [],
    isCategory: true, // aggregator of entities

    [Keys.ClusterID]: cluster.id,
    viewType: VIEW_TYPE.LOGICAL_NAMESPACE_OVERVIEW,
  };

  const all = new Set();
  cluster.nodes.forEach((node) => {
    node.namespaces.forEach((namespace) => {
      all.add(namespace.name);
    });
  });

  all.forEach((namespace) => {
    let ns = {
      name: namespace,
      children: [],

      [Keys.ClusterID]: cluster.id,
      [Keys.Namespace]: namespace,
      viewType: VIEW_TYPE.LOGICAL_NAMESPACE,
    };

    namespaces.children.push(ns);
  });

  return namespaces;
}

// convert the cluster into a logical entity tree
export function toLogicalEntityTree(cluster) {
  let root = {
    name: cluster.name,
    isAuthenticated: cluster.isAuthenticated,
    children: [],
    isCategory: true, // aggregator of entities

    viewType: VIEW_TYPE.LOGICAL_CLUSTER,
    [Keys.ClusterID]: cluster.id,
  };

  if (!cluster.isAuthenticated)
    return root;

  let children = [];
  children.push(toLogicalNamespaces(cluster));

  root.children = children;
  return root;
}
