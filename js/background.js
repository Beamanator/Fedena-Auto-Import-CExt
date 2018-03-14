// Initialize firebase:
var config = {
    apiKey: "AIzaSyDRulUofq1zYX7Z1J2t--A2CRzObthoIDc",
    authDomain: "fedenaimportconfig.firebaseapp.com",
    databaseURL: "https://fedenaimportconfig.firebaseio.com",
    // storageBucket: "fedenaimportconfig.appspot.com",
    messagingSenderId: "197993359621"
};
firebase.initializeApp(config);

// React when a browser action's icon is clicked.
chrome.browserAction.onClicked.addListener(function(tab) {
    // NOTE: console.log doesn't show from background scripts!
});

// background script:
chrome.runtime.onMessage.addListener(function(mObj, MessageSender, sendResponse) {
    var action = mObj.action;
    var async = false;

    switch(action) {
        // open new tab, send student URL
        case 'open_tab':
            var URL = mObj.studentURL;

            chrome.tabs.create({
                url: URL,
                active: false
            });
            break;

        // close given tab
        case 'close_tab':
            chrome.tabs.remove(MessageSender.tab.id);
            break;

        // increment counters for button clicks at /button_clicks/*
        case 'firebase_increment_button_count':
            FB_incrementClickCount(firebase, mObj);
            break;

        // increment firebase student CREATED count at <base>/student_stats/created
        case 'firebase_increment_student_created_count':
            FB_incrementStudentCreatedCount(firebase, mObj);
            break;

        // increment firebase student FIXED count at <base>/student_stats/fixed
        case 'firebase_increment_student_fixed_count':
            FB_incrementStudentFixedCount(firebase, mObj);
            break;

        // get firebase student count at /student_stats/count
        //  -> response should be handled by sendResponse
        case 'firebase_get_student_count':
            FB_getStudentCount(firebase, sendResponse);
            // firebase sendResponse needs async
            async = true;
            break;  

        // send message back saying no response found:
        default:
            chrome.tabs.sendMessage(MessageSender.tab.id, {
                message: 'message_not_handled_by_background_script'
            });
    } 

    // returns true if asyncronous is needed
    if (async) return true;
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    chrome.tabs.query({
        url: "https://stars.fedena.com/student/view_all"
    }, function(result) {

        if (result.length === 1) { // This is what i'd expect
            var tab = result[0];

            chrome.tabs.sendMessage(tab.id, {
                message: 'fix_next_student',
                next: 'weeeee',
                tabStuff: tabId,
                other: removeInfo
            });
        } else {
            // not sure what to do here
            var tabs = results;
        }
    });
});