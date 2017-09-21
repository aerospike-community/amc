import { VIEW_TYPE } from 'classes/constants';
import { isEntitiesEqual as isEqual } from 'classes/util';

// the keys as defined in reducer/currentView
const Keys = {
  ClusterID: 'clusterID',
  Index:     'indexName',
  Node:      'nodeHost',
  Namespace: 'namespaceName',
  Set:       'setName',
  UDF:       'udfName',
};

function toUDF(cluster, isLogicalView = false) {
  let udfs = {
    name: 'UDF',
    children: [],
    isCategory: true, // aggregator of entites

    [Keys.ClusterID]: cluster.id,
    viewType: isLogicalView ? VIEW_TYPE.LOGICAL_UDF_OVERVIEW : VIEW_TYPE.UDF_OVERVIEW,
  };

  if (!Array.isArray(cluster.modules)) 
    return udfs;

  cluster.modules.forEach((udf) => {
    let c = Object.assign({}, udf, {
      children: [],

      [Keys.ClusterID]: cluster.id,
      [Keys.UDF]: udf.name,
      viewType: isLogicalView ? VIEW_TYPE.LOGICAL_UDF : VIEW_TYPE.UDF,
    });

    udfs.children.push(c);
  });

  return udfs;
}

// returns an array of the nodes of the cluster
function allNodes(cluster) {
  if (!Array.isArray(cluster.nodes)) 
    return [];

  const nodes = [];
  cluster.nodes.forEach((node) => {
    let n = Object.assign({}, node, {
      children: [],
      name: node.host,

      [Keys.ClusterID]: cluster.id,
      [Keys.Node]:  node.host,
      viewType: VIEW_TYPE.NODE,
    });
    if (Array.isArray(n.namespaces))
      n.children = allNamespaces(cluster, node);

    nodes.push(n);
  });

  nodes.sort(nameSort);
  return nodes;
}

// returns an array of the namespaces of the node
function allNamespaces(cluster, node) {
  const namespaces = [];

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

    namespaces.push(ns);
  });

  return namespaces;
}

function toIndexes(cluster, isLogicalView = false) {
  const indexes = {
    name: 'INDEXES',
    children: [],
    isCategory: true, // aggregator of entities

    [Keys.ClusterID]: cluster.id,
    viewType: isLogicalView ? VIEW_TYPE.LOGICAL_INDEXES_OVERVIEW 
                            : VIEW_TYPE.INDEXES_OVERVIEW,
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
      viewType: isLogicalView ? VIEW_TYPE.LOGICAL_INDEX : VIEW_TYPE.INDEX,

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

const PARENT_KEY = '_tree_parent';

// assign a parent to each of the nodes in the tree 
function assignParent(root) {
  const k = PARENT_KEY;

  const assign = (node) => {
    node.children.forEach((c) => {
      c[k] = node;
      assign(c);
    });
  };

  root[k] = null;
  assign(root);
}

// find the entity in the given tree
function findEntity(root, entity) {
  // depth first search of the tree
  const dfs = (node, cb) => {
    cb(node);
    node.children.forEach((n) => {
      dfs(n, cb);
    });
  };

  let entityNode = null;

  dfs(root, (node) => {
    if (isEqual(node, entity))
      entityNode = node;
  });

  return entityNode;
}

// convert the cluster into a physical entity tree representation
export function toPhysicalEntityTree(cluster, isAuthenticated) {
  let root = {
    name: cluster.name,
    children: [],
    isAuthenticated: isAuthenticated,
    isCategory: true, // aggregator of entities

    viewType: VIEW_TYPE.CLUSTER,
    [Keys.ClusterID]: cluster.id,
  };

  if (!isAuthenticated)
    return root;

  let children = [];
  children = children.concat(allNodes(cluster));
  children.push(toUDF(cluster));
  children.push(toIndexes(cluster));

  root.children = children;

  sortTree(root);
  assignParent(root);
  return root;
}

// returns an array of entities which are the ancestors of the given entity
export function findAncestors(tree, entity) {
  const ancestors = [];
  const node = findEntity(tree, entity);
  
  if (!node)
    return [];

  const k = PARENT_KEY;
  for (let p = node[k]; p !== null; p = p[k])
    ancestors.push(p);

  return ancestors;
}

// ----------------------------------------------------------------------------
// LOGICAL ENTITY TREE

function toLogicalNamespaces(cluster) {
  const namespaces = [];

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

    namespaces.push(ns);
  });

  namespaces.sort(nameSort);
  return namespaces;
}

// convert the cluster into a logical entity tree
export function toLogicalEntityTree(cluster, isAuthenticated) {
  let root = {
    name: cluster.name,
    children: [],
    isAuthenticated: isAuthenticated,
    isCategory: true, // aggregator of entities

    viewType: VIEW_TYPE.LOGICAL_CLUSTER,
    [Keys.ClusterID]: cluster.id,
  };

  if (!isAuthenticated)
    return root;

  let children = [];
  children = children.concat(toLogicalNamespaces(cluster));
  children.push(toUDF(cluster, true));
  children.push(toIndexes(cluster, true));

  root.children = children;

  sortTree(root);
  assignParent(root);
  return root;
}

function sortTree(root) {
  const vt = root.viewType;
  if (vt !== VIEW_TYPE.CLUSTER && vt !== VIEW_TYPE.LOGICAL_CLUSTER) {
    root.children.sort(nameSort);
  }
  root.children.forEach((c) => sortTree(c));
}

function nameSort(a, b) {
  const an = a.name, bn = b.name;
  if (an < bn)
    return -1;
  if (an > bn)
    return 1;
  return 0;
}


