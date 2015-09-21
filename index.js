var BOOTSTRAP = this;
var self = require('sdk/self');
const { getMostRecentBrowserWindow } = require('sdk/window/utils');

const {ChromeWorker} = require("chrome");

var winscardWorker = new ChromeWorker(require("sdk/self").data.url('winscardWorker.js'));
winscardWorker.addEventListener('message', function(msg) {
	console.error('incoming message from worker to server, msg:', msg.data);
	BOOTSTRAP[msg.data.shift()].apply(BOOTSTRAP, msg.data);
});

getMostRecentBrowserWindow().alert('hi');

/*
var myEvent = window.document.createEvent('CustomEvent');
var myEventDetail = {hello:'world'};
myEvent.initCustomEvent('SCardEstablishContext', true, true, myEventDetail);
window.document.dispatchEvent(myEvent);
*/

getMostRecentBrowserWindow().document.addEventListener("SCardEstablishContext", function(evt){
	console.error('evt:', evt);
	getMostRecentBrowserWindow().alert('triggered SCardEstablishContext');
		var callbackName = 'cb' + Math.random();
		BOOTSTRAP[callbackName] = function(reader_names, hSC) {
			getMostRecentBrowserWindow().alert('calling callback from chrome worker');
			delete BOOTSTRAP[callbackName];
            evt.target.setAttribute("reader_names", reader_names);
            evt.target.setAttribute("HContext",hSC);
            var doc = evt.target.ownerDocument;
            var AnswerEvt = doc.createElement("SCardEstablishContext");
            doc.documentElement.appendChild(AnswerEvt);
            var event = doc.createEvent("HTMLEvents");
            event.initEvent("SCardEstablishContextEvent",true,false);
            AnswerEvt.dispatchEvent(event);
		};
		getMostRecentBrowserWindow().alert('ok will ask worker to do some work then call this newly setup callback');
		winscardWorker.postMessage(['SCardEstablishContextFUNC', callbackName]);
}, false, true);
	
getMostRecentBrowserWindow().document.addEventListener("Connect", function(e){
	winscardWorker.postMessage(['Connect']);
}, false, true);
	
getMostRecentBrowserWindow().document.addEventListener("Transmit", function(e){
	winscardWorker.postMessage(['Transmit']);
}, false, true);
	
getMostRecentBrowserWindow().alert('done attaching event listeners');