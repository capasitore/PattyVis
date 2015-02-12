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

  describe('searched on "py"', function() {
    beforeEach(function() {
      element(by.model('sp.query')).sendKeys('py');
    });

    it('should have one search result', function() {
      expect(element.all(by.css('.search-result')).count()).toBe(1);
    });
  });

  describe('search on "bla"', function() {
    beforeEach(function() {
      element(by.model('sp.query')).sendKeys('bla');
    });

    it('should have zero search results', function() {
      expect(element.all(by.css('.search-result')).count()).toBe(0);
    });
  });

  describe('click on settings gear', function() {
    beforeEach(function() {
      element(by.css('.btn.gear')).click();
    });

    it('should show settings panel', function() {
      var panel = element(by.css('.settings-panel'));
      expect(panel.isDisplayed()).toBeTruthy();
    });
  });

  describe('click on help icon', function() {
    beforeEach(function() {
      element(by.css('.btn.help')).click();
    });

    it('should show help panel', function() {
      var panel = element(by.css('.help-panel'));
      expect(panel.isDisplayed()).toBeTruthy();
    });
  });

  describe('clicking on toolbox icon', function() {
    beforeEach(function() {
      element(by.css('.toolbox .btn')).click();
    });

    it('should show tools', function() {
      var panel = element(by.css('.toolbox-tools'));
      expect(panel.isDisplayed()).toBeTruthy();
    });

    describe('and then clicking on bottom toolbox icon', function() {

      beforeEach(function() {
        element(by.css('.toolbox .btn')).click();
        // wait for toolbox to close, otherwise it will still be displayed partle
        browser.sleep(200);
      });

      it('should hide tools', function() {
        var panel = element(by.css('.toolbox-tools'));
        expect(panel.isDisplayed()).toBeFalsy();
      });
    });

    describe('and then clicking on top toolbox icon', function() {

      beforeEach(function() {
        element(by.css('.toolbox-tray-top')).click();
        // wait for toolbox to close, otherwise it will still be displayed partle
        browser.sleep(200);
      });

      it('should hide tools', function() {
        var panel = element(by.css('.toolbox-tools'));
        expect(panel.isDisplayed()).toBeFalsy();
      });
    });
  });

});
