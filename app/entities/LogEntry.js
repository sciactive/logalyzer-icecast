import Nymph from "Nymph";
import Entity from "NymphEntity";

export default class LogEntry extends Entity {

  // === Static Properties ===

  static etype = "logentry";
  // The name of the server class
  static class = "LogEntry";

  static title = "Generic Log Entry";
  static usesIpLocationInfo = false;
  static filePattern = /^not_a_real_log_class/;

  static aggregateFunctions = {
    ...LogEntry.defaultAggregateFunctions
  }

  static defaultAggregateFunctions = {
    rawLogLine: {
      name: "Raw Logs",
      axisLabel: "Log Line",
      defaultChartFunction: "rawDataEntries",
      func: function (entries) {
        const data = [], eventHandlers = {};

        // Add all log entry lines.
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const label = entry.get("line");

          data.push({
            label: label,
            value: 1
          });

          eventHandlers[label] = function(app) {
            const selectors = app.get("selectors");
            selectors.push({
              type: "&",
              strict: [
                ["line", label]
              ]
            });
            app.set({selectors});
            alert("Added selector to filter for this log entry.");
          };
        }

        return {data, eventHandlers};
      }
    }
  }
  static httpRequestBasedAggregateFunctions = {
    remoteHost: {
      name: "Remote Host (Unique Visitors)",
      axisLabel: "Requests",
      defaultChartFunction: "rawDataEntries",
      func: LogEntry.aggregateExtractBy("remoteHost", "Unknown")
    },

    resources: {
      name: "Requested Resources",
      axisLabel: "Requests",
      defaultChartFunction: "horizontalBar",
      func: LogEntry.aggregateExtractBy("resource", "Unknown")
    },

    resources: {
      name: "Request Methods",
      axisLabel: "Methods",
      defaultChartFunction: "horizontalBar",
      func: LogEntry.aggregateExtractBy("method", "Unknown")
    },

    responseStatusCode: {
      name: "Response Status Code",
      axisLabel: "Requests",
      defaultChartFunction: "horizontalBar",
      func: LogEntry.aggregateExtractBy("statusCode", "Unknown")
    }
  }
  static refererBasedAggregateFunctions = {
    refererByDomain: {
      name: "Referer By Domain",
      axisLabel: "Requests",
      defaultChartFunction: "horizontalBar",
      func: function (entries) {
        const values = {
          "Direct Request": 0,
          "Unknown": 0
        };
        const refererDomainRegex = /^\w+:\/\/(?:www\.)?([A-Za-z0-9-:.]+)/g;
        const data = [], eventHandlers = {};

        // Go through and parse out the domain of the referer.
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const value = entry.get("referer");

          if (!value || value === "-") {
            values["Direct Request"]++;
          } else {
            const match = refererDomainRegex.exec(value);
            if (match !== null && match.length > 1) {
              if (values[match[1]]) {
                values[match[1]]++;
              } else {
                values[match[1]] = 1;
              }
            } else {
              values["Unknown"]++;
            }
          }
        }

        // Convert every entry to an array.
        for (let k in values) {
          data.push({
            label: k + " (" + (Math.round(values[k] / entries.length * 10000) / 100) + "%, " + values[k] + ")",
            value: values[k]
          });
        }

        data.sort((a, b) => b.value - a.value);

        return {data, eventHandlers};
      }
    },

    searchTerms: {
      name: "Search Terms",
      axisLabel: "Requests",
      defaultChartFunction: "horizontalBar",
      func: function (entries) {
        const values = {};
        const searchTermsByServiceRegex = /^\w+:\/\/(?:www\.)?[A-Za-z0-9-:.]+\/.*q=([^&]+)(?:&|$)/g;
        const data = [], eventHandlers = {};

        // Go through and parse out the search terms and service.
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const value = entry.get("referer");

          if (!(!value || value === "-")) {
            const match = searchTermsByServiceRegex.exec(value);
            if (match !== null && match.length > 1) {
              const key = decodeURIComponent(match[1].replace(/\+/g, ' '));
              if (values[key]) {
                values[key]++;
              } else {
                values[key] = 1;
              }
            }
          }
        }

        // Convert every entry to an array.
        for (let k in values) {
          const label = k + " (" + (Math.round(values[k] / entries.length * 10000) / 100) + "%, " + values[k] + ")";
          data.push({
            label: label,
            value: values[k]
          });
          eventHandlers[label] = function(app) {
            const selectors = app.get("selectors");
            selectors.push({
              type: "&",
              like: [
                ["referer", "%q="+(encodeURIComponent(k).replace(/%20/g, '+').replace(/%/g, '\%').replace(/_/g, '\_'))+"%"]
              ]
            });
            app.set({selectors});
            alert("Added selector to filter for this searth term.");
          };
        }

        data.sort((a, b) => b.value - a.value);

        return {data, eventHandlers};
      }
    },

    searchTermsByService: {
      name: "Search Terms by Service",
      axisLabel: "Requests",
      defaultChartFunction: "horizontalBar",
      func: function (entries) {
        const values = {};
        const searchTermsByServiceRegex = /^\w+:\/\/(?:www\.)?([A-Za-z0-9-:.]+)\/.*q=([^&]+)(?:&|$)/g;
        const data = [], eventHandlers = {};

        // Go through and parse out the search terms and service.
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const value = entry.get("referer");

          if (!(!value || value === "-")) {
            const match = searchTermsByServiceRegex.exec(value);
            if (match !== null && match.length > 2) {
              const key = match[1] + ": " + decodeURIComponent(match[2].replace(/\+/g, ' '));
              if (values[key]) {
                values[key]++;
              } else {
                values[key] = 1;
              }
            }
          }
        }

        // Convert every entry to an array.
        for (let k in values) {
          const label = k + " (" + (Math.round(values[k] / entries.length * 10000) / 100) + "%, " + values[k] + ")";
          data.push({
            label: label,
            value: values[k]
          });
          eventHandlers[label] = function(app) {
            const selectors = app.get("selectors");
            selectors.push({
              type: "&",
              like: [
                ["referer", "%"+k.split(": ", 2)[0]+"/%q="+(encodeURIComponent(k.split(": ", 2)[1]).replace(/%20/g, '+').replace(/%/g, '\%').replace(/_/g, '\_'))+"%"]
              ]
            });
            app.set({selectors});
            alert("Added selector to filter for this searth term and service.");
          };
        }

        data.sort((a, b) => b.value - a.value);

        return {data, eventHandlers};
      }
    },

    allReferers: {
      name: "All Referers",
      axisLabel: "Requests",
      defaultChartFunction: "horizontalBar",
      func: LogEntry.aggregateExtractBy("referer", "Direct Request")
    }
  }
  static userAgentBasedAggregateFunctions = {
    browser: {
      name: "Browser",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaBrowserName", "Unknown")
    },

    browserVersion: {
      name: "Browser Version",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaBrowserName", "Unknown", "uaBrowserVersion")
    },

    cpuArchitecture: {
      name: "CPU Architecture",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaCpuArchitecture", "Unknown")
    },

    deviceType: {
      name: "Device Type",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaDeviceType", "Unknown")
    },

    deviceVendor: {
      name: "Device Vendor",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaDeviceVendor", "Unknown")
    },

    deviceModel: {
      name: "Device Model",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaDeviceVendor", "Unknown", "uaDeviceModel")
    },

    engine: {
      name: "Engine",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaEngineName", "Unknown")
    },

    engineVersion: {
      name: "Engine Version",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaEngineName", "Unknown", "uaEngineVersion")
    },

    os: {
      name: "OS",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaOsName", "Unknown")
    },

    osVersion: {
      name: "OS Version",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("uaOsName", "Unknown", "uaOsVersion")
    },

    allUserAgents: {
      name: "All User Agents",
      axisLabel: "Requests",
      defaultChartFunction: "horizontalBar",
      func: LogEntry.aggregateExtractBy("userAgent", "Unknown")
    }
  }
  static geoBasedAggregateFunctions = {
    timeZone: {
      name: "Timezone",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("timeZone", "Unknown")
    },

    continentCode: {
      name: "Continent Code",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("continentCode", "Unknown")
    },

    continent: {
      name: "Continent",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("continent", "Unknown")
    },

    countryCode: {
      name: "Country Code",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("countryCode", "Unknown")
    },

    country: {
      name: "Country",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("country", "Unknown")
    },

    provinceCode: {
      name: "Province Code",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("provinceCode", "Unknown")
    },

    province: {
      name: "Province",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("province", "Unknown")
    },

    postalCode: {
      name: "Postal Code",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("postalCode", "Unknown")
    },

    city: {
      name: "City",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("city", "Unknown")
    },

    countryProvince: {
      name: "Country and Province",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("country", "Unknown", "province")
    },

    countryCity: {
      name: "Country and City",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("country", "Unknown", "city")
    },

    countryPostalCode: {
      name: "Country and Postal Code",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("country", "Unknown", "postalCode")
    },

    provinceCity: {
      name: "Province and City",
      axisLabel: "Requests",
      defaultChartFunction: "pie",
      func: LogEntry.aggregateExtractBy("province", "Unknown", "city")
    }
  }

  // === Constructor ===

  constructor(id) {
    super(id);

    // === Instance Properties ===

    this.logLines = [];
  }

  // === Instance Methods ===

  /**
   * @return {boolean} True is the line was parsed, false if the entry should be skipped according to options.
   */
  async parseAndSet(line, options, ipDataCache) {
    return false;
  }

  parseFields(line, maxFields, separator = ' ', enclosingPairs = ['""', '[]']) {
    // Parse fields and place them back together for things enclosed in pairs.
    let fieldsBroken = line.split(separator), fields = [], searching = null;
    for (let k = 0; k < fieldsBroken.length; k++) {
      if (searching || fields.length >= maxFields) {
        fields[fields.length - 1] += separator + fieldsBroken[k];
        if (searching && fieldsBroken[k].substr(-1) === searching) {
          searching = null;
        }
      } else {
        fields.push(fieldsBroken[k]);
        for (let pair of enclosingPairs) {
          let [start, end] = pair.split('');
          if (fieldsBroken[k].substr(0, 1) === start && ((start === end && fieldsBroken[k].length === 1) || fieldsBroken[k].substr(-1) !== end)) {
            searching = end;
          }
        }
      }
    }
    return fields;
  }

  parseUAString(userAgent) {
    const uaParser = require('ua-parser-js');

    const uaParts = uaParser(userAgent);

    return {
      uaBrowserName: uaParts.browser.name,
      uaBrowserVersion: uaParts.browser.version,
      uaCpuArchitecture: uaParts.cpu.architecture,
      uaDeviceModel: uaParts.device.model,
      uaDeviceType: uaParts.device.type,
      uaDeviceVendor: uaParts.device.vendor,
      uaEngineName: uaParts.engine.name,
      uaEngineVersion: uaParts.engine.version,
      uaOsName: uaParts.os.name,
      uaOsVersion: uaParts.os.version,
    }
  }

  addLine(line) {
    this.logLines.push(line);
  }

  getLogLine() {
    return this.logLines.join("\n");
  }

  isLogLineContinuation(line) {
    return false;
  }

  isLogLineComplete() {
    return !!this.logLines.length;
  }

  // === Static Methods ===

  static isLogLineStart(line) {
    // Just check the line doesn't start with white space.
    return !line.match(/^\s/);
  }

  static getIpLocationData(ip, ipDataCache) {
    const curl = require('curl');

    if (ipDataCache[ip]) {
      return Promise.resolve(ipDataCache[ip]);
    }

    console.log("Looking up location data for IP: "+ip);

    ipDataCache[ip] = new Promise((resolve, reject) => {
      LogEntry.getGeoLite2IpInfo(ip).then((ipInfo) => {
        let nonNullFound = false;
        for (let p in ipInfo) {
          if (ipInfo[p] !== null) {
            nonNullFound = true;
            break;
          }
        }
        if (!nonNullFound) {
          console.log("IP location data not found in GeoLite2 DB.");
          console.log("Falling back to ip2c.org...");
          fallback();
          return;
        }
        resolve(ipInfo);
      }, (err) => {
        console.log("Couldn't get location data from GeoLite2 DB: "+err);
        console.log("Falling back to ip2c.org...");
        fallback();
      });
      function fallback() {
        const ipInfoUrl = `http://ip2c.org/${ip}`;
        curl.get(ipInfoUrl, null, function(err, response, body) {
          if (err) {
            console.log("Couldn't get location data: "+err);
            reject(err);
            return;
          }
          const [result, countryCode, unused, country] = body.split(';', 4);
          switch (result) {
            case '0':
            case '2':
            default:
              resolve({
                timeZone: null,
                continentCode: null,
                continent: null,
                countryCode: null,
                country: null,
                provinceCode: null,
                province: null,
                postalCode: null,
                city: null
              });
              return;
            case '1':
              resolve({
                timeZone: null,
                continentCode: null,
                continent: null,
                countryCode,
                country,
                provinceCode: null,
                province: null,
                postalCode: null,
                city: null
              });
              return;
          }
          resolve({});
        });
      }
    });

    return ipDataCache[ip];
  }

  static getGeoLite2IpInfo(...args) {
    return LogEntry.serverCallStatic('getGeoLite2IpInfo', args);
  }

  ///////////////////////////////////////
  //  Aggregetor Functions
  ///////////////////////////////////////

  static aggregateExtractBy(property, unknownIsCalled, appendProperty) {
    return function (entries) {
      const values = {};
      const data = [], eventHandlers = {};

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const value = entry.get(property);

        if (!value || value === "-") {
          if (values[unknownIsCalled]) {
            values[unknownIsCalled].value++;
          } else {
            values[unknownIsCalled] = {value: 1};
          }
        } else {
          let finalVal = value, valueAppend;
          if (appendProperty) {
            valueAppend = entry.get(appendProperty);
            if (!valueAppend) {
              valueAppend = '-';
            }
            finalVal += ' '+valueAppend;
          }
          if (values[finalVal]) {
            values[finalVal].value++;
          } else {
            if (appendProperty) {
              values[finalVal] = {
                propValue: value,
                appendValue: valueAppend,
                value: 1
              };
            } else {
              values[finalVal] = {
                propValue: value,
                value: 1
              };
            }
          }
        }
      }

      // Convert every entry to an array.
      for (let k in values) {
        const label = k + " (" + (Math.round(values[k].value / entries.length * 10000) / 100) + "%, " + values[k].value + ")";
        data.push({
          label: label,
          value: values[k].value
        });
        if (k === unknownIsCalled) {
          eventHandlers[label] = function(app) {
            const selectors = app.get("selectors");
            selectors.push({
              type: "|",
              data: [
                [property, false]
              ],
              strict: [
                [property, "-"]
              ],
              "!isset": [property]
            });
            app.set({selectors});
            alert("Added selector to filter for an unknown " + property + ".");
          };
        } else {
          eventHandlers[label] = function(app) {
            const selectors = app.get("selectors");
            if (appendProperty) {
              if (values[k].appendValue === "-") {
                selectors.push({
                  type: "&",
                  "1": {
                    type: "|",
                    data: [
                      [appendProperty, false]
                    ],
                    strict: [
                      [appendProperty, "-"]
                    ],
                    "!isset": [appendProperty]
                  },
                  strict: [
                    [property, values[k].propValue]
                  ]
                });
              } else {
                selectors.push({
                  type: "&",
                  strict: [
                    [property, values[k].propValue],
                    [appendProperty, values[k].appendValue]
                  ]
                });
              }
            } else {
              selectors.push({
                type: "&",
                strict: [
                  [property, values[k].propValue]
                ]
              });
            }
            app.set({selectors});
            alert("Added selector to filter for this " + property + (appendProperty ? " and " + appendProperty : "") + ".");
          };
        }
      }

      data.sort((a, b) => b.value - a.value);

      return {data, eventHandlers};
    };
  }
}

Nymph.setEntityClass(LogEntry.class, LogEntry);
export {LogEntry};
