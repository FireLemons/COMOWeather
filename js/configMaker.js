M.textareaAutoResize(document.getElementById('configJSON'));

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
    configText: "",
    configTextEdited: false
  },
  methods: {
  },
  mounted: function() {
    this.configText = JSON.stringify(this.config, null, 2)
  },
  watch: {
    config: {
      handler: function(updatedConfig){
        if(!this.configTextEdited){
          this.configText = JSON.stringify(this.config, null, 2)
        }
      },
      deep: true
    }
  }
})

