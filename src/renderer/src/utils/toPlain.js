/** Copy without Vue observers: IPC only accepts plain data. */
export default (data) => JSON.parse(JSON.stringify(data));
