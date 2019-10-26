// ==UserScript==
// @name         MarketWatch
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  adds market transcation data into history description column
// @author       taiga
// @match        https://screeps.com/a/#!/market/history
// @grant        none
// @run-at       document-ready

// ==/UserScript==

(function() {
  'use strict';

    var $timeout = angular.element(document.body).injector().get('$timeout');

    const appendDescriptions = function() {
      $timeout(function() {
        $(".market-history-description .fa-question-circle").each(function(i,el) {
          var d =  JSON.parse(el.title);
          var content = "";
          if (d.order) {
            content = `${d.order.roomName} ${d.order.type} ${d.order.totalAmount}<strong>${d.order.resourceType}</strong>@${d.order.price}`;
          }
          else{
            content = `<strong>${d.resourceType}</strong> ${d.amount}@${d.price} ${d.roomName} => ${d.targetRoomName}`;
          }
          $(el).append($.parseHTML(content)).removeClass("fa fa-question-circle");
        });
      },1);
   };

   function onHashChange() {
    if (location.hash == "#!/market/history") {
      angular.element(document).ready(function () {
        $timeout(function() {
          angular.element("[app-view-segment=2]").scope().$watch("History.data.money.list", function(newVal) {
            appendDescriptions();
          });
          appendDescriptions();
        },1000);
      });
    }
  }

  window.onhashchange = onHashChange;
  angular.element(document).ready(function () {
    onHashChange();
  });

})();