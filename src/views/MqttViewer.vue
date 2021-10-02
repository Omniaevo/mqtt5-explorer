<template>
  <div class="page-grid-container">
    <v-app-bar v-bind:color="darkTheme ? 'gray' : 'white'" flat>
      <div class="d-flex align-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on:click="disconnectFromMqtt()"
              v-on="on"
              icon
            >
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </template>
          <span>Disconnect</span>
        </v-tooltip>

        <div class="ms-4">
          <div class="title">Connected to: {{ connectionProperties.name }}</div>
          <div class="caption grey--text small-line">{{ $connection.url }}</div>
        </div>
      </div>
      <v-spacer />
      <div v-if="selectedId !== -1" center-vertical>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on:click="resetSelection()"
              v-on="on"
              color="error"
              icon
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
          <span>Clear selection</span>
        </v-tooltip>
      </div>
    </v-app-bar>

    <div class="mx-4 my-2 explorer-grid-container">
      <v-card class="treeview-container" flat>
        <v-treeview
          v-bind:items="treeData"
          dense
          hoverable
          open-on-click
          rounded
        >
          <template slot="label" slot-scope="{ item, leaf }" class="ma-0">
            <div
              v-bind:class="{
                primary: item.blink || selectedId === item.id,
                'white--text': item.blink || selectedId === item.id,
                'px-2': true,
                rounded: true,
              }"
              v-on:click="getProperties(item)"
            >
              {{ item.name }}
              {{ item.value !== undefined ? "=" : "" }}
              <span class="font-weight-black">
                {{ item.value !== undefined ? item.value.payload : "" }}
              </span>
              <span v-if="leaf" class="caption grey--text ms-4">
                ({{ item.size }} elements inside)
              </span>
            </div>
          </template>
        </v-treeview>
      </v-card>

      <div class="properties-container">
        <v-expansion-panels v-model="packetPanels" multiple>
          <v-expansion-panel>
            <v-expansion-panel-header>Topic</v-expansion-panel-header>
            <v-expansion-panel-content>
              <div v-if="itemSelected" wrap-text>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on:click="deleteDialog = true"
                      v-on="on"
                      class="me-4"
                      icon
                    >
                      <v-icon color="error">mdi-delete</v-icon>
                    </v-btn>
                    {{ itemSelected.topic }}
                  </template>
                  <span>Delete "{{ itemSelected.topic }}" topic</span>
                </v-tooltip>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-header>Value</v-expansion-panel-header>
            <v-expansion-panel-content>
              <div v-if="itemSelected">
                <div
                  v-if="itemSelected.old"
                  class="d-flex rounded mb-1"
                  wrap-text
                >
                  <div class="error px-2 py-1">
                    <v-icon dark small>mdi-delete</v-icon>
                  </div>
                  <div
                    class="px-4 flex-fill py-1"
                    style="background: #ff535655"
                  >
                    {{ itemSelected.old.payload }}
                  </div>
                </div>
                <div v-if="itemSelected.value" class="d-flex rounded" wrap-text>
                  <div class="success px-2 py-1">
                    <v-icon dark small>mdi-lightning-bolt</v-icon>
                  </div>
                  <div
                    class="px-4 flex-fill py-1"
                    style="background: #41b05655"
                  >
                    {{ itemSelected.value.payload }}
                  </div>
                </div>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>

          <v-expansion-panel v-if="upSupported">
            <v-expansion-panel-header>Properties</v-expansion-panel-header>
            <v-expansion-panel-content v-if="itemSelected">
              <pre>{{ (itemSelected.value || {}).properties || "" }}</pre>
            </v-expansion-panel-content>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-header>
              <div center-vertical>
                <v-tooltip
                  v-if="
                    itemEditing !== undefined &&
                    itemEditing.value &&
                    itemSelected &&
                    itemSelected.value &&
                    itemSelected.value.payload !== undefined &&
                    packetPanels.includes(panelsMaxIndex)
                  "
                  bottom
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on:click.stop="loadForPublish(itemSelected)"
                      v-on="on"
                      class="me-2"
                      icon
                      small
                    >
                      <v-icon>mdi-sync</v-icon>
                    </v-btn>
                  </template>
                  <span>Syncronize with new data</span>
                </v-tooltip>
                <span>Publish</span>
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content v-if="itemEditing">
              <v-card flat>
                <v-card-text class="pa-0">
                  <v-text-field
                    v-model="itemEditing.topic"
                    placeholder="example/topic"
                    label="Topic"
                  />
                  <div v-if="itemEditing.value">
                    <v-textarea
                      v-model="itemEditing.value.payload"
                      label="Value"
                      rows="2"
                    ></v-textarea>
                    <div row>
                      <v-spacer />
                      <v-switch
                        v-model="itemEditing.value.retain"
                        label="Retain"
                        inset
                      />
                      <v-select
                        v-model="itemEditing.value.qos"
                        v-bind:items="qos"
                        class="small-input"
                        label="QoS"
                      />
                    </div>
                    <div v-if="upSupported">
                      <v-divider />
                      <v-card-title class="ps-0">Properties</v-card-title>
                      <v-text-field
                        v-model="itemEditing.value.properties.contentType"
                        label="Content type"
                      />
                      <v-card-text class="ps-0">User properties</v-card-text>
                      <div
                        v-for="(prop, i) in userPropertiesArray"
                        v-bind:key="'user-properties-' + i"
                        row
                      >
                        <v-text-field v-model="prop.key" label="Key" />
                        <v-text-field v-model="prop.value" label="Value" />
                        <v-btn
                          v-on:click="userPropertiesArray.splice(i, 1)"
                          icon
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn
                            v-bind="attrs"
                            v-on:click="
                              userPropertiesArray.push({
                                key: 'key',
                                value: 'value',
                              })
                            "
                            v-on="on"
                            block
                          >
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>Add new property</span>
                      </v-tooltip>
                    </div>
                  </div>
                </v-card-text>
                <v-card-actions class="pa-0 pt-4">
                  <v-spacer />
                  <v-btn v-on:click="publishItem" color="primary">
                    Publish
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-expansion-panel-content>
            <v-expansion-panel-content v-else>
              <v-btn v-on:click="newForPublishing()" block>
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>

    <v-dialog v-model="deleteDialog" max-width="50ch" persistent>
      <v-card>
        <v-card-title>Confirm delete</v-card-title>
        <v-card-text>
          Do you want to delete
          <span class="font-weight-black">
            "{{ itemSelected ? itemSelected.topic : "" }}"
          </span>
          topic and his childs?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn v-on:click="deleteDialog = false" color="primary" text>
            Cancel
          </v-btn>
          <v-btn
            v-on:click="
              deleteTopic(itemEditing);
              deleteDialog = false;
            "
            color="error"
            text
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<style scoped>
.page-grid-container {
  height: 100vh;
  display: grid;
  grid-template-rows: min-content 1fr;
}

.explorer-grid-container {
  overflow: hidden;
  display: grid;
  grid-template-areas: "treeview explorer";
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 1em;
}

.treeview-container {
  grid-area: "treeview";
  overflow: auto;
}

.properties-container {
  grid-area: "properties";
  overflow: auto;
}

.small-input {
  max-width: 10ch;
}

div[wrap-text] {
  overflow-wrap: break-word;
}

div[row] {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.5em;
}

div[center-vertical] {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.small-line {
  line-height: 0.5rem;
}
</style>

<script>
import ConnectionProperties from "../models/ConnectionProperties";
import TreeNode from "../models/TreeNode";

export default {
  name: "MqttViewer",

  data: () => ({
    treeData: [],
    packetPanels: [],
    qos: [0, 1, 2],
    connectionProperties: new ConnectionProperties(),
    itemSelected: undefined,
    itemEditing: undefined,
    userPropertiesArray: [],
    selectedId: -1,
    deleteDialog: false,
  }),

  computed: {
    upSupported() {
      return this.$connection.protocolVersion > 4;
    },
    panelsMaxIndex() {
      return this.upSupported ? 3 : 2;
    },
  },

  beforeMount() {
    this.connectionProperties.init(
      this.$store.getters.getConnectionByIndex(this.$route.params.index)
    );
    this.$connection.init(
      this.connectionProperties,
      this.add,
      this.merge,
      () => this.treeData.length
    );
  },

  mounted() {
    this.$connection.connect((err) => this.disconnectFromMqtt(err.toString()));
  },

  methods: {
    disconnectFromMqtt(msg = undefined) {
      this.$connection.disconnect(() => {
        this.$router.replace({ name: "Home" });

        if (msg !== undefined) this.$bus.$emit("error", msg);
      });
    },
    getProperties(item) {
      this.itemSelected = item;
      this.selectedId = item.id;
      this.loadForPublish(item);
      this.packetPanels = [...Array(this.panelsMaxIndex).keys()];
    },
    resetSelection() {
      this.itemSelected = undefined;
      this.selectedId = -1;
      this.itemEditing = undefined;
      this.userPropertiesArray = [];
      this.packetPanels = [];
    },
    newForPublishing() {
      this.loadForPublish(
        new TreeNode(() => {}, ["topic"], { topic: "example/topic" }),
        false
      );
    },
    loadForPublish(item, clone = true) {
      this.itemEditing = clone ? JSON.parse(JSON.stringify(item)) : item;
      this.userPropertiesArray = [];

      if (this.itemEditing.value === undefined) {
        this.itemEditing.value = {
          retain: false,
          qos: 0,
          payload: undefined,
        };

        if (this.upSupported) {
          this.itemEditing.value.properties = {
            contentType: "",
            userProperties: {},
          };
        }
      }

      if (this.upSupported && !this.itemEditing.value.properties) {
        this.itemEditing.value.properties = {};
      }

      if (
        this.upSupported &&
        this.itemEditing.value.properties &&
        this.itemEditing.value.properties.userProperties
      ) {
        this.userPropertiesArray = Object.keys(
          this.itemEditing.value.properties.userProperties
        ).map((k) => ({
          key: k,
          value: this.itemEditing.value.properties.userProperties[k],
        }));
      }
    },
    add(node) {
      this.treeData.push(node);
    },
    merge(index, node) {
      const toDelete = this.treeData[index].merge(node);

      if (toDelete) {
        this.treeData.splice(index, 1);
      }

      return toDelete;
    },
    publishItem() {
      this.itemEditing.value.topic = this.itemEditing.topic;

      if (this.upSupported) {
        if (!this.itemEditing.value.properties) {
          this.itemEditing.value.properties = {};
        }

        this.itemEditing.value.properties.userProperties = {};

        this.userPropertiesArray.forEach((prop) => {
          // eslint-disable-next-line prettier/prettier
          this.itemEditing.value.properties.userProperties[prop.key] = prop.value;
        });
      }

      this.$connection.publish(this.itemEditing.value);
    },
    deleteTopic(item) {
      if (item.children?.length > 0) {
        item.children.forEach((c) => this.deleteTopic(c));
      }

      if (item.value) {
        item.value.payload = null;
      } else {
        item.value = { payload: null, topic: item.topic, qos: 0, retain: true };
      }

      this.$connection.publish(item.value);
      this.resetSelection();
    },
  },
};
</script>
