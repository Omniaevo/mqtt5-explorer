import BaseEntity from "./BaseEntity";

class File extends BaseEntity {
  value = undefined;
  old = undefined;

  constructor(id, name, value) {
    super(id, name);
    this.value = value;
  }

  initObject() {
    this.id = this.idFun();
  }

  merge(file) {
    this.old = this.value;
    this.value = file.value;
  }
}

export default File;
