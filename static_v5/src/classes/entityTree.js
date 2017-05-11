import { VIEW_TYPE } from './constants';

// Each entity is uniquely identified by the path from its
// cluster.
// 'path' is defined by the entities it encounters on its traversal 
// from the cluster root.
//
// Example: clusterID/NODES/nodeHost/namespaces/namespaceName


const UDF = 'UDF';
const NODES = 'NODES';
const NAMESPACES = 'NAMESPACES';
const SETS = 'SETS';

// extracts the entity information from the entityPath
export function extractEntityInfo(entityPath) {
  let clusterID, nodeHost, namespaceName,
      setName, udfName;

  let tokens = entityPath.split('/');
  let i = 0;
  while (i < tokens.length) {
    let token = tokens[i];
    let nextToken = tokens[i+1];

    if (i === 0) {
      clusterID = token;
      i++;
    } else if (token === NODES) {
      nodeHost = nextToken;
      i += 2;
    } else if (token === NAMESPACES) {
      namespaceName = nextToken;
      i += 2;
    } else if (token === SETS) {
      setName = nextToken;
      i += 2;
    } else if (token === UDF) {
      udfName = nextToken;
      i += 2;
    } else { // unrecognized skip
      console.warn(`Unrecognized entity path param ${token}`);
      i++;
    }
  }

  return {
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
    setName: setName,
    udfName: udfName,
  };
}

function processPath(entity, orderedPath) {
  let path = '';
  orderedPath.forEach((k) => {
    let v = entity[k];
    if (v) {
      if (k === 'nodeHost')
        v = NODES + '/' + v;
      else if (k === 'namespaceName')
        v = NAMESPACES + '/' + v;
      else if (k === 'setName')
        v = SETS + '/' + v;
      else if (k === 'udfName')
        v = UDF + '/' + v;

      if (path.length > 0 && !path.endsWith('/'))
        path += '/';
      path += v;
    }
  });
  return path;
}

export function toEntityPath(entity) {
  const { clusterID, nodeHost, namespaceName } = entity;
  const { setName, udfName } = entity;
  
  let path = '';
  path = processPath(entity, ['clusterID', 'nodeHost', 'namespaceName', 'setName']);
  if (path !== '')
    return path;

  path = processPath(entity, ['clusterID', 'udfName']);
  if (path != '')
    return path

  throw new Error('In processing path');
}

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

