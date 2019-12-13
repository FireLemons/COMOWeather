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
    }
  },
  computed: {
    configPrinted: function() {
      return JSON.stringify(this.config, null, 2)
    }
  },
  methods: {
  }
})

