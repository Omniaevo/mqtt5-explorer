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
                primary: item.blink,
                'white--text': item.blink,
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
              <div wrap-text>
                {{ itemSelected ? itemSelected.topic : "" }}
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

          <v-expansion-panel v-if="$connection.protocolVersion === 5">
            <v-expansion-panel-header>Properties</v-expansion-panel-header>
            <v-expansion-panel-content v-if="itemSelected">
              <pre>{{ (itemSelected.value || {}).properties || "" }}</pre>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
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

div[wrap-text] {
  overflow-wrap: break-word;
}

.small-line {
  line-height: 0.5rem;
}
</style>

<script>
import ConnectionProperties from "../models/ConnectionProperties";

export default {
  name: "MqttViewer",

  data: () => ({
    treeData: [],
    packetPanels: [0, 1, 2],
    connectionProperties: new ConnectionProperties(),
    itemSelected: undefined,
  }),

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
      this.itemSelected = { ...item };
    },
    add(node) {
      this.treeData.push(node);
    },
    merge(index, node) {
      if (this.treeData[index].merge(node)) {
        this.treeData.splice(index, 1);
      }
    },
  },
};
</script>
