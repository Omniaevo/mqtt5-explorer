import BaseEntity from "./BaseEntity.js";
import File from "./File.js";

class Folder extends BaseEntity {
  children = [];
  child = undefined;
  size = 0;

  constructor(id, structure, value) {
    super(id, structure[0]);

    if (structure.length === 2) {
      this.child = new File(id, structure[1], value);
    } else {
      this.child = new Folder(id, structure.slice(1), value);
    }
  }

  initObject() {
    this.id = this.idFun();
    this.child.initObject();
    this.children.push(this.child);
    this._size();
  }

  merge(folder) {
    let merged = false;

    for (let i = 0; i < this.size; i++) {
      if (folder.child.name === this.children[i].name) {
        this.children[i].merge(folder.child);
        merged = true;
        break;
      }
    }

    if (!merged) {
      folder.child.initObject();
      this.children.push(folder.child);
      this._size();
    }
  }

  _size() {
    this.size = this.children.length;
  }
}

export default Folder;
