import { isEntitiesEqual as isEqual } from 'classes/util';

// A set of entities
export default class EntitySet {
  constructor() {
    this.entities = [];
  }

  clone() {
    let set = new EntitySet();
    set.entities = this.entities.slice(); // copy
    return set;
  }

  add(entity) {
    const i = this.entities.findIndex((e) => isEqual(e, entity));
    if (i === -1)
      this.entities.push(entity);
  }

  delete(entity) {
    const i = this.entities.findIndex((e) => isEqual(e, entity));
    if (i !== -1)
      this.entities.splice(i, 1);
  }

  has(entity) {
    const i = this.entities.findIndex((e) => isEqual(e, entity));
    return i !== -1;
  }
}

