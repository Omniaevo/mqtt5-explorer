/**
 * Props and events shared by the Home connection tile and row.
 * `tabState` is the state of the open tab of this connection, if any.
 */
export const connectionItemProps = {
  connection: { type: Object, required: true },
  menuItems: { type: Array, required: true },
  tabState: { type: String, default: undefined },
  /** Search text to highlight in the name and URL. */
  query: { type: String, default: "" },
};

export const connectionItemEmits = ["connect", "action"];
