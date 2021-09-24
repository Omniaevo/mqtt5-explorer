class TreeNode {
  id = undefined;
  name = undefined;
  value = undefined;
  old = undefined;
  children = [];
  child = undefined;
  blink = false;

  constructor(id, structure, value) {
    this.#idFun = id;
    this.name = structure[0];

    if (structure.length > 1) {
      this.child = new TreeNode(id, structure.slice(1), value);
    } else {
      this.#setValue(value);
    }
  }

  get size() {
    return this.children.length;
  }

  initObject() {
    this.id = this.#idFun();

    if (this.child !== undefined) {
      this.child.initObject();
      this.children.unshift(this.child);
      this.child = undefined;
    }
  }

  merge(node) {
    this.#blink();

    // `node` is a leaf
    if (node.child === undefined) {
      this.#setValue(node.value);

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

  #idFun = () => {};

  #blink = () => {
    this.blink = true;
    setTimeout(() => this.#stopBlink(), 120);
  };

  #stopBlink = () => (this.blink = false);

  #setValue = (newValue) => {
    this.old = this.value;
    this.value =
      ((newValue || {}).payload || []).length > 0 ? newValue : undefined;
  };
}

export default TreeNode;
