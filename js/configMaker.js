const countryCodes = ["AD","AR","BD","BO","CF","CU","DZ","FM","GQ","ID","JO","KR","LS","MG","MV","NL","PH","RS","SI","SV","TN","UY","ZA","AE","AS","BE","BR","CG","CV","EC","FR","GR","IE","JP","KW","LT","MH","MW","NO","PK","RU","SK","SY","TO","UZ","ZM","AF","AT","BF","BS","CH","CY","EE","GA","GT","IL","KE","KZ","LU","MK","MX","NP","PL","RW","SL","SZ","TR","VA","ZW","AG","AU","BG","BT","CI","CZ","EG","GB","GW","IN","KG","LA","LV","ML","MY","NR","PS","SA","SM","TD","TT","VC","AI","AW","BH","BW","CL","DE","ER","GD","GY","IQ","KH","LB","LY","MM","MZ","NZ","PT","SB","SN","TG","TV","VE","AL","AX","BI","BY","CM","DJ","ES","GE","HN","IR","KI","LC","MA","MN","NA","OM","PW","SC","SO","TH","TZ","VN","AM","AZ","BJ","BZ","CN","DK","ET","GH","HR","IS","KM","LI","MC","MR","NE","PA","PY","SD","SR","TJ","UA","VU","AO","BA","BM","CA","CO","DM","FI","GM","HT","IT","KN","LK","MD","MT","NG","PE","QA","SE","SS","TL","UG","WS","AQ","BB","BN","CD","CR","DO","FJ","GN","HU","JM","KP","LR","ME","MU","NI","PG","RO","SG","ST","TM","US","YE"]

const countryCodeAutocompleteData = {}

countryCodes.forEach((c_code) => {
  countryCodeAutocompleteData[c_code] = `../assets/img/country_flags/${c_code}.svg`
})

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
    M.Autocomplete.init(document.getElementById('country-code-selector'), {data: countryCodeAutocompleteData});

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

