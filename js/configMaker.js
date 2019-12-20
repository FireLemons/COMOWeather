const configManager = new Vue({
  el: '#config',
  data: {
    config: {
      log: {
        logDir: ""
      },
      twitter: {
        consumer_key: "",
        consumer_secret: "",
        access_token_key: "",
        access_token_secret: ""
      },
      weather: {
        openWeatherMap: {
          location: {
          },
          key: ""
        }
      }
    },
    ui: {
      configJSON: {
        configText: "",
        configTextEdited: false
      },
      weather: {
        openWeatherMap: {
          locationType: "id"
        }
      }
    }
  },
  methods: {
  },
  mounted: function() {
    M.Tabs.init(document.querySelectorAll('.tabs'))
    M.textareaAutoResize(document.getElementById('configJSON'));
    this.ui.configJSON.configText = JSON.stringify(this.config, null, 2)
  },
  watch: {
    config: {
      handler: function(updatedConfig){
        if(!this.ui.configJSON.configTextEdited){
          this.ui.configJSON.configText = JSON.stringify(this.config, null, 2)
        }
      },
      deep: true
    }
  }
})

