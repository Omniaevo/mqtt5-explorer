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

        <v-tooltip class="ms-4 d-flex align-center" style="height: 100%" bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-icon
              v-bind="attrs"
              v-on="on"
              class="grayscale"
              color="primary"
              v-if="connectionState === statesList.DISCONNECTED"
            >
              mdi-lan-pending
            </v-icon>
            <v-icon
              v-bind="attrs"
              v-on="on"
              color="error"
              v-else-if="connectionState === statesList.ERROR"
            >
              mdi-lan-disconnect
            </v-icon>
            <v-icon
              v-bind="attrs"
              v-on="on"
              class="pending"
              color="primary"
              v-else-if="connectionState === statesList.PENDING"
            >
              mdi-lan-pending
            </v-icon>
            <v-icon v-bind="attrs" v-on="on" color="primary" v-else>
              mdi-lan-connect
            </v-icon>
          </template>
          <span v-if="connectionState === statesList.DISCONNECTED">
            Disconnected
          </span>
          <span v-if="connectionState === statesList.ERROR">
            An error occurred
          </span>
          <span v-if="connectionState === statesList.PENDING">
            Connection pending ...
          </span>
          <span v-else> Connected </span>
        </v-tooltip>

        <div class="ms-4">
          <div class="title">Connection: {{ connectionProperties.name }}</div>
          <div class="caption grey--text small-line">{{ $connection.url }}</div>
        </div>
      </div>
      <v-spacer />
      <v-slide-y-transition>
        <v-text-field
          v-show="searchTreeVisible"
          v-model="searchTerm"
          v-on:click:append-outer="searchInfoDialog = true"
          append-outer-icon="mdi-information-outline"
          class="me-2"
          label="Search"
          ref="searchField"
          dense
          hide-details
          outlined
        >
          <template slot="append">
            <v-btn-toggle v-model="filterType" dense>
              <v-btn
                v-bind:value="searchModes.CASES"
                v-on:click.stop
                title="Uppercase/Lowercase"
                small
                icon
              >
                <v-icon small>mdi-format-letter-case</v-icon>
              </v-btn>
              <v-btn
                v-bind:value="searchModes.WORDS"
                v-on:click.stop
                title="Match whole word"
                small
                icon
              >
                <v-icon small>mdi-format-letter-matches</v-icon>
              </v-btn>
              <v-btn
                v-bind:value="searchModes.REG_EXP"
                v-on:click.stop
                title="Regular expression"
                small
                icon
              >
                <v-icon small>mdi-regex</v-icon>
              </v-btn>
            </v-btn-toggle>
            <v-btn v-on:click="toggleSearchField" class="ms-2" icon small>
              <v-icon small>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-slide-y-transition>
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
          v-bind:filter="filterTree"
          v-bind:items="treeData"
          v-bind:search="searchTerm"
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
            <v-expansion-panel-header>
              <div>
                <span>Payload</span>
                <span
                  v-if="itemSelected && itemSelected.counter > 0"
                  v-bind:title="getCountMessage(itemSelected.counter, false)"
                  class="caption ms-2 grey--text"
                >
                  ({{ getCountMessage(itemSelected.counter, true) }})
                </span>
              </div>
            </v-expansion-panel-header>
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
                    class="px-4 flex-fill py-1 long-payload"
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
                    class="px-4 flex-fill py-1 long-payload"
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
                    v-bind:outlined="outline"
                    placeholder="example/topic"
                    label="Topic"
                  />
                  <div v-if="itemEditing.value">
                    <v-textarea
                      v-model="itemEditing.value.payload"
                      v-bind:outlined="outline"
                      label="Value"
                      rows="2"
                    ></v-textarea>
                    <div row>
                      <v-spacer />
                      <div center-vertical>
                        <v-switch
                          v-model="itemEditing.value.retain"
                          class="me-4"
                          label="Retain"
                          inset
                        />
                      </div>
                      <v-select
                        v-model="itemEditing.value.qos"
                        v-bind:items="qos"
                        v-bind:outlined="outline"
                        class="small-input"
                        label="QoS"
                        hide-details
                      />
                    </div>
                    <div v-if="upSupported">
                      <v-divider />
                      <v-card-title class="ps-0">Properties</v-card-title>
                      <v-text-field
                        v-model="itemEditing.value.properties.contentType"
                        v-bind:outlined="outline"
                        label="Content type"
                        hide-details
                      />
                      <v-switch
                        v-model="advancedProperties"
                        class="me-4"
                        label="Advanced properties"
                        inset
                      />
                      <div v-if="advancedProperties">
                        <div row>
                          <v-text-field
                            v-model="itemEditing.value.properties.topicAlias"
                            v-bind:min="1"
                            v-bind:outlined="outline"
                            label="Topic alias"
                            type="number"
                          />
                          <v-text-field
                            v-model="
                              itemEditing.value.properties.messageExpiryInterval
                            "
                            v-bind:min="1"
                            v-bind:outlined="outline"
                            label="Expiring interval (s)"
                            type="number"
                          />
                        </div>
                        <div row>
                          <v-text-field
                            v-model="itemEditing.value.properties.responseTopic"
                            v-bind:outlined="outline"
                            label="Response topic"
                          />
                          <v-text-field
                            v-model="correlationData"
                            v-bind:outlined="outline"
                            label="Correlation data"
                          />
                        </div>
                      </div>
                      <v-card-text class="ps-0">User properties</v-card-text>
                      <div
                        v-for="(prop, i) in userPropertiesArray"
                        v-bind:key="'user-properties-' + i"
                        class="mb-5"
                        row
                      >
                        <v-text-field
                          v-model="prop.key"
                          v-bind:outlined="outline"
                          label="Key"
                          hide-details
                        />
                        <v-text-field
                          v-model="prop.value"
                          v-bind:outlined="outline"
                          label="Value"
                          hide-details
                        />
                        <div center-vertical>
                          <v-btn
                            v-on:click="userPropertiesArray.splice(i, 1)"
                            icon
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </div>
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
          Are you sure you want to delete
          <span class="font-weight-black">
            "{{ itemSelected ? itemSelected.topic : "" }}"
          </span>
          topic and its children?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn v-on:click="deleteDialog = false" text> Cancel </v-btn>
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

    <v-dialog v-model="searchInfoDialog" max-width="70ch" persistent scrollable>
      <v-card>
        <v-card-title>How to search</v-card-title>
        <v-card-text>
          <p>
            <strong>Basic search.</strong> Normally the search will be performed
            on all topics full names or the leaves names (the last portion of a
            topic).
          </p>
          <p>Example: <em>measures/device/sensor</em></p>
          <p>
            <strong>Advanced search.</strong> Use the prefix
            <kbd>{{ searchQuery }}</kbd> to perform a search inside of the value
            object (it is in <em>JSON</em> format), the root fields are
            typically: <strong>payload</strong> and
            <strong>properties</strong> (consult the MQTT protocol
            specifications for more); the next part of the string contains the
            sequence of keys to search in (<em>dot</em>
            notation) and the value to search, the two parts are separated by a
            <code>=</code>.
          </p>
          <p>
            Example:
            <em>{{ searchQuery }}properties.userProperties.key=value</em>
          </p>
          <span>Search types applicable for all above cases:</span>
          <ul>
            <li>
              <v-icon small>mdi-format-letter-case</v-icon>: select this option
              if the search has to be case sensitive;
            </li>
            <li>
              <v-icon small>mdi-format-letter-matches</v-icon>: select this
              option if the searched word has to perfectly match;
            </li>
            <li>
              <v-icon small>mdi-regex</v-icon>: select this option to use
              regular expressions.
            </li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn v-on:click="searchInfoDialog = false" text> Got it </v-btn>
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

.long-payload {
  word-break: break-all;
}

div[wrap-text] {
  overflow-wrap: break-word;
}

div[row] {
  display: flex;
  flex-direction: row;
  align-content: center;
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

.grayscale {
  -webkit-filter: grayscale(100%);
  -moz-filter: grayscale(100%);
  filter: grayscale(100%);
}

.pending {
  animation-duration: 1s;
  animation-name: changeGrayscale;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;
}

@keyframes changeGrayscale {
  from {
    -webkit-filter: grayscale(0%);
    -moz-filter: grayscale(0%);
    filter: grayscale(0%);
  }

  to {
    -webkit-filter: grayscale(100%);
    -moz-filter: grayscale(100%);
    filter: grayscale(100%);
  }
}
</style>

<script>
import Connection from "../utils/Connection";
import ConnectionProperties from "../models/ConnectionProperties";
import SearchEngine from "../utils/SearchEngine";
import TreeNode from "../models/TreeNode";
import { ipcRenderer } from "electron";

export default {
  name: "MqttViewer",

  data: () => ({
    advancedProperties: false,
    treeData: [],
    dataPacketPanels: [],
    qos: [0, 1, 2],
    connectionProperties: new ConnectionProperties(),
    itemSelected: undefined,
    itemEditing: undefined,
    userPropertiesArray: [],
    selectedId: -1,
    deleteDialog: false,
    connectionState: Connection.connectionStates.PENDING,
    statesList: Connection.connectionStates,
    searchTreeVisible: false,
    searchInfoDialog: false,
    searchTerm: undefined,
    filterType: undefined,
    searchModes: SearchEngine.modes,
    searchQuery: SearchEngine.QUERY,
  }),

  computed: {
    correlationData: {
      get() {
        return this.itemEditing.value.properties.correlationData
          ? Buffer.from(
              this.itemEditing.value.properties.correlationData
            ).toString("utf-8")
          : undefined;
      },
      set(value) {
        this.itemEditing.value.properties.correlationData = value;
      },
    },
    upSupported() {
      return this.$connection.protocolVersion > 4;
    },
    panelsMaxIndex() {
      return this.upSupported ? 3 : 2;
    },
    packetPanels: {
      get() {
        return this.dataPacketPanels.length > 0
          ? this.dataPacketPanels
          : [this.panelsMaxIndex];
      },
      set(value) {
        this.dataPacketPanels = value;
      },
    },
    filterTree() {
      return (item, search) =>
        item.search(search, this.filterType || SearchEngine.modes.ALL);
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

    ipcRenderer.send("enterViewerPage");
    ipcRenderer.on("searchPressed", this.toggleSearchField);
  },

  mounted() {
    this.$connection.connect(
      () => (this.connectionState = this.statesList.CONNECTED),
      (err) => this.disconnectFromMqtt(err)
    );
  },

  beforeDestroy() {
    ipcRenderer.removeListener("searchPressed", this.toggleSearchField);
  },

  methods: {
    toggleSearchField() {
      if (this.searchTreeVisible) this.$refs.searchField.blur();

      this.searchTreeVisible = !this.searchTreeVisible;

      this.$nextTick(() => {
        if (!this.searchTreeVisible) this.searchTerm = undefined;
        else this.$refs.searchField.focus();
      });
    },
    disconnectFromMqtt(msg = undefined) {
      this.$connection.disconnect(() => {
        this.connectionState =
          msg !== undefined
            ? this.statesList.ERROR
            : this.statesList.DISCONNECTED;

        this.$router.replace({ name: "Home" }).then(() => {
          this.$bus.$emit(
            msg === undefined ? "info" : "error",
            msg || "Connection timed out"
          );
        });
      });
    },
    getProperties(item) {
      this.itemSelected = item;
      this.selectedId = item.id;
      this.loadForPublish(item);
      this.packetPanels = [...Array(this.panelsMaxIndex).keys()];
    },
    getCountMessage(count, truncate) {
      const truncatedNum = truncate && count > 1000000 ? "1000000+" : count;
      const plural = count > 1 ? "s" : "";

      return `${truncatedNum} message${plural} received`;
    },
    resetSelection() {
      this.itemSelected = undefined;
      this.selectedId = -1;
      this.itemEditing = undefined;
      this.userPropertiesArray = [];
      this.packetPanels = [];
      this.advancedProperties = false;
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
          this.itemEditing.value.properties.userProperties[prop.key] =
            prop.value;
        });

        // eslint-disable-next-line prettier/prettier
        if (
          this.itemEditing.value.properties.messageExpiryInterval != undefined
        ) {
          this.itemEditing.value.properties.messageExpiryInterval = Number(
            this.itemEditing.value.properties.messageExpiryInterval
          );
        }

        if (this.itemEditing.value.properties.topicAlias != undefined) {
          this.itemEditing.value.properties.topicAlias = Number(
            this.itemEditing.value.properties.topicAlias
          );
        }

        if (this.itemEditing.value.properties.correlationData != undefined) {
          this.itemEditing.value.properties.correlationData = Buffer.from(
            this.itemEditing.value.properties.correlationData
          );
        }

        if (
          this.itemEditing.value.properties.correlationData === undefined ||
          this.itemEditing.value.properties.correlationData.length === 0
        ) {
          delete this.itemEditing.value.properties.correlationData;
        }
      }

      this.$connection.publish(this.itemEditing.value);
    },
    deleteTopic(item) {
      const childrenList = this.getAllChildren(item);

      childrenList.forEach((node) => {
        if (node.value) {
          node.value.payload = undefined;
        } else {
          node.value = {
            payload: undefined,
            topic: node.topic,
            qos: 0,
            retain: true,
          };
        }

        this.$connection.publish(node.value);
      });

      this.resetSelection();
    },
    getAllChildren(item) {
      if ((item.children?.length || 0) > 0) {
        return item.children.reduce((childrenList, current) => {
          return [...childrenList, ...this.getAllChildren(current)];
        }, []);
      }

      return [item];
    },
  },
};
</script>
