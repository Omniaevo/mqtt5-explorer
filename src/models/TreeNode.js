class TreeNode {
  id = undefined;
  name = undefined;
  value = undefined;
  old = undefined;
  children = [];
  child = undefined;
  idFun = () => {};

  constructor(id, structure, value) {
    this.idFun = id;
    this.name = structure[0];

    if (structure.length > 1) {
      this.child = new TreeNode(id, structure.slice(1), value);
    } else {
      this._setValue(value);
    }
  }

  get size() {
    return this.children.length;
  }

  initObject() {
    this.id = this.idFun();

    if (this.child !== undefined) {
      this.child.initObject();
      this.children.unshift(this.child);
      this.child = undefined;
    }
  }

  merge(node) {
    // `node` is a leaf
    if (node.child === undefined) {
      this._setValue(node.value);

      return this.size === 0 && this.value === undefined;
    }

    let childIndex = this.children.findIndex((c) => node.child.name === c.name);

    if (childIndex < 0) {
      node.child.initObject();
      this.children.unshift(node.child);
    } else if (this.children[childIndex].merge(node.child)) {
      // The child is empty so has to be removed
      this.children.splice(childIndex, 1);
    }

    return this.size === 0 && this.value === undefined;
  }

  _setValue(newValue) {
    this.old = this.value;
    this.value =
      ((newValue || {}).payload || []).length > 0 ? newValue : undefined;
  }
}

export default TreeNode;
