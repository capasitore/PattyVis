(function() {
  'use strict';

  function SearchPanelController(SitesService, PointcloudService) {
    this.pageSize = 2;
    this.currentPage = 1;
    this.SitesService = SitesService;

    this.toggleButtons = {
      _site_pc: true,
      _drive_map: true,
      _site_mesh: false
    };

    Object.defineProperties(this.toggleButtons, {
      site_pc: {
        get: function() {
          return this._site_pc;
        },
        set: function(bool) {
          this._site_pc = bool;
        },
        enumerable: true,
        configurable: true
      },
      drive_map: {
        get: function() {
          return this._drive_map;
        },
        set: function(bool) {
          this._drive_map = bool;
        },
        enumerable: true,
        configurable: true
      },
      site_mesh: {
        get: function() {
          return this._site_mesh;
        },
        set: function(bool) {
          this._site_mesh = bool;
        },
        enumerable: true,
        configurable: true
      }
    });

    this.reconstruction_mesh = 0;

    SitesService.ready.then(function() {
      SitesService.query = 'site:162';
    });

    this.lookAtSite = function(site) {
      PointcloudService.lookAtSite(site);
    };
    this.showLabel = function(site) {
      PointcloudService.showLabel(site);
    };
    this.enterOrbitMode = function(site) {
      PointcloudService.enterOrbitMode(site);
    };
    /**
     * jump back to first page when query changes
     */
    this.onQueryChange = function() {
      this.currentPage = 1;
    };

  }

  angular.module('pattyApp.searchbox')
    .controller('SearchPanelController', SearchPanelController);
})();
