class Entity {
  id = undefined;
  name = undefined;
  idFun = () => {};

  constructor(id, name) {
    this.idFun = id;
    this.name = name;
  }
}

export default Entity;
