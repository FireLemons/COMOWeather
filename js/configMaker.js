const configManager = new Vue({
  el: '#config',
  data: {
    config: {}
  },
  computed: {
    configPrinted: function() {
      return JSON.stringify(this.config, null, 2)
    }
  },
  methods: {
  }
})

