const assert = require('assert')

const baseUrl = 'http://localhost:3000/compareCurrencies' // baseUrl of the app we are testing, it's localhost here, as we're starting a local server in Travis CI cycle

// see the full webdriverio browser API here: http://webdriver.io/api.html
describe("a:", function () { //typeahead's compareCurrencies implementation


    var childSel = 'div.tt-menu.tt-open>div>:nth-child(1)'
    var inputSel = '.tt-input'

    //opens typeahead menu

    function FRparams() {
        return browser.execute(() => {
            let path = window.location.pathname.replace(/\/$/, '')

            return path.substr(path.lastIndexOf('/') + 1).split('-').filter(i => !!i) // get the required array and filter out possible empty fields
        })
    }

    function listChild() {
        browser.click(inputSel)
        var currency = browser.execute(() => {
            var handle = Meteor.subscribe('approvedcurrencies')
            var list = $('div.tt-menu.tt-open').children()
            var name
            //if list is empty then the list div doesn't have children

            if (list.children().length) { // this will hold even if the data wasn't found, it'll return the div, so you can check here whether it's a currency or a notFound div and return the appropriate result
                name = list.children()[0].innerHTML

                return testingCurrencies.findOne({currencyName: name}) || name
            } else {
                return list[0].innerHTML // This is the actual problem that causes tests to fail. innerHTML is currencyName, while we use currencySymbol in the URL. Adding a data attribute with currencySymbol and using that value or something similar should do the trick
            }
        }).value
        return currency
    }

    it('initializes test data successfully', function() {
        browser.url('http://localhost:3000/')
        browser.pause(10000)
        // tests were failing because there was no currency data in the CI environment, so we have to create some test data here
        browser.execute(() => {
            Meteor.call('generateTestCurrencies', (err, data) => {})

            return 'ok'
        })
        browser.pause(10000)
    })

    it('renders route comparedCurrencies with typeahead', function () {
        browser.url(`${baseUrl}/`) // navigate to the home route `/`
        browser.pause(10000) // let it load, wait for 2 seconds

        assert(browser.isExisting('.tt-input'), true) // check if at least one currency card has rendered, isExisting === $() !== undefined
        assert(browser.isVisible('.tt-input'), true) // check if at least one currency card is visible on the page isVisible === $().is(':visible')
    })
    it("follows 'focus' prop focusing on page enter", function () {
        assert(browser.hasFocus(inputSel), true)
    })
    it("follows 'quickEnter' prop, it triggers add action", function () {
        var child = listChild()
        browser.setValue(inputSel, "Enter")
        browser.pause(2000)
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
        browser.pause(1000)
    })
    it("will autocomplete", function () {
        var child = listChild()
        browser.setValue(inputSel, "Tab")
        browser.pause(2000)
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
        browser.pause(1000)
    })
    it("will select", function () {
        var child = listChild()
        browser.click(childSel)
        browser.pause(2000)
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
        browser.pause(1000)
    })
    it("updates typeahead menu source on outside change, works as if input is constantly focused(therefore testing cursor change as well)", function () {
        var child = listChild()
        browser.click(childSel)
        browser.pause(2000)
        assert(child._id != listChild()._id, true)

        // If I understand this test correctly, upon deletion of a currency that's compared, it should return to the menu for selection.
        // So, basically, if you select the first one, the ids of that one and the new first one in the list won't match (the first assert).
        // When you delete the currency, it should go back to the selection, so, ids of the first one and the deleted one match, as they're supposed to.
        // So, there's no need to update the child here, hence I've commented it out and the test works again.

        // child = listChild()
        browser.click(".js-delete")
        browser.pause(2000)
        assert(child._id == listChild()._id, true)
    })
    it("doesn't erase input on outside change", function () {
        listChild() //focus
        browser.click(childSel)
        browser.pause(2000)
        browser.setValue(inputSel, "bit")
        browser.click(".js-delete")
        browser.pause(2000)
        assert(browser.getValue(inputSel) == "bit", true)
    })
    it("can use nx framework (typeNX filename) for empty template", function () {
        assert(!!browser.execute(() => window.nx).value != false, true)
    })
    // it ("doesn't erase input on change of cursor observer", function(){ //no access to collections
    //   assert(true, true)r
    // })
    it("renders input text in empty template", function () {
        var string = "zzzzzzzzzzzzzzzzzzzzzz////"
        browser.setValue(inputSel, string)
        browser.pause(2000)
        var child = listChild()
        assert(child.indexOf(string)!= -1, true)
    })
    // it ('runs add function on click', function(){
    //   assert(true, true)
    // })
})