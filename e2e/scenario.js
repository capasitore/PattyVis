'use strict';

/* global describe, beforeEach, it, expect */
/* global element, by, browser */

describe('pattyApp', function() {

  beforeEach(function() {
    browser.get('index.html');
  });

  it('should have patty title', function() {
    expect(browser.getTitle()).toMatch('Project Patty Visualisation');
  });

  describe('initial state', function() {
    it('should have zero search results', function() {
      expect(element.all(by.css('.search-result')).count()).toBe(0);
    });
    it('should not show settings panel', function() {
      var panel = element(by.css('.settings-panel'));
      expect(panel.isDisplayed()).toBeFalsy();
    });

    it('should not show tools', function() {
      var panel = element(by.css('.toolbox-tools'));
      expect(panel.isDisplayed()).toBeFalsy();
    });
  });

  describe('searched on "site:162"', function() {
    beforeEach(function() {
      element(by.model('sp.SitesService.query')).sendKeys('site:162');
      // wait for search to complete
      browser.sleep(600);
    });

    it('should have details of site 162 displayed', function() {
      var results = element(by.css('.site-details'));
      expect(results.isDisplayed()).toBeTruthy();
      expect(results.getText()).toContain('Inspect site');
    });
  });

  describe('search on "zzzz"', function() {
    beforeEach(function() {
      element(by.model('sp.SitesService.query')).sendKeys('zzzz');
      // wait for search to complete
      browser.sleep(600);
    });

    it('should have no results', function() {
      var results = element(by.css('.search-results'));
      expect(results.getText()).toContain('No results');
    });
  });

  describe('click on settings gear', function() {
    beforeEach(function() {
      element(by.css('.icon-big.gear-icon')).click();
    });

    it('should show settings panel', function() {
      var panel = element(by.css('.settings-panel'));
      expect(panel.isDisplayed()).toBeTruthy();
    });
  });

  describe('click on help icon', function() {
    beforeEach(function() {
      element(by.css('.icon-big.help-icon')).click();
    });

    it('should show help panel', function() {
      var panel = element(by.css('.help-panel'));
      expect(panel.isDisplayed()).toBeTruthy();
    });
  });

  describe('clicking on toolbox icon', function() {
    beforeEach(function() {
      element(by.css('.icon-big.toolbox-icon')).click();
    });

    it('should show tools', function() {
      var panel = element(by.css('.toolbox-tools'));
      expect(panel.isDisplayed()).toBeTruthy();
    });

    describe('and then clicking on bottom toolbox icon', function() {

      beforeEach(function() {
        element(by.css('.icon-big.toolbox-icon')).click();
        // wait for toolbox to close, otherwise it will still be displayed partly
        browser.sleep(200);
      });

      it('should hide tools', function() {
        var panel = element(by.css('.toolbox-tools'));
        expect(panel.isDisplayed()).toBeFalsy();
      });
    });

    describe('and then clicking on top toolbox icon', function() {

      beforeEach(function() {
        // wait for toolbox to open, otherwise icon is moving when click is attempted
        browser.sleep(500);
        element(by.css('.icon-big.toolbox-tray-top-icon')).click();
        // wait for toolbox to close, otherwise it will still be displayed partly
        browser.sleep(200);
      });

      it('should hide tools', function() {
        var panel = element(by.css('.toolbox-tools'));
        expect(panel.isDisplayed()).toBeFalsy();
      });
    });
  });

});
