/**
 * REMOVE THE PUSH NOTIFICATION ENTITLEMENT – plugins/with-no-push-entitlement.js
 *
 * REFERENCE FROM
 * https://docs.expo.dev/config-plugins/plugins/
 */

const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withNoPushEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });
};
