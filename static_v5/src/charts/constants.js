// operations for which the throughput charts can be drawn
export const ThroughputOperations = {
  Batch: 'Batch',
  Query: 'Query',
  Read:  'Read',
  Scan:  'Scan',
  UDF:   'UDF',
  Write: 'Write',
  XDR_Write: 'XDR_Write',
  XDR_Read: 'XDR_Read',
};

// the grouping in the throughput charts
export const ThroughputGrouping = {
  ByTotal: 'ByTotal',
  ByNamespace: 'ByNamespace',
};

// operations for which the latency charts can be drawn
export const LatencyOperations = {
  Query: 'Query',
  Read:  'Read',
  UDF:   'UDF',
  Write: 'Write',
};
