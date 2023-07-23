/**
 * Add an event handler for the popup
 *
 * Note: It is best practice to always define a synchronous listener
 *       function for the runtime.onMessage event.
 *       If defined asynchronously, it will always return a Promise
 *       and therefore answer all messages, even if a different listener
 *       defined elsewhere is supposed to handle these.
 * 
 *       The listener should only return a Promise for messages it is
 *       actually supposed to handle.
 */
messenger.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // check that this message is for us, and handle if so
    if (message &&
	message.hasOwnProperty("command") &&
	message.hasOwnProperty("tag")
       ) {
        return commandHandler(message, sender);	
    };
    // Return false if the message was not handled by this listener.
    return false;
});

// Get the key corresponding to a tag ('' if tag does not exist)
async function getTagKey(tag) {
    //console.log('Background: Getting key for',tag) ;
    let tags = await messenger.messages.listTags();
    let key = ''
    tags.forEach(element => {
    	if (element.tag === tag) {
    	    key = element.key
    	}
    });
    return key;
}

function addTag(tag) {
    //console.log("Popup: Adding new tag:", tag) ;
    // key must match /^[$a-zA-Z0-9]+$/)
    // (this is different for tags created through the manage tags
    // interface...)
    // make lowercase, trim and remove all illegal chars
    let key = tag.toLowerCase() ;
    key = key.trim() ;
    key = key.replaceAll(/[^$a-zA-Z0-9]/g,'') ;
    //console.log("Popup: With key:", key) ;
    messenger.messages.createTag(key,tag,"#000000");
    return key;
}


// Get the currently selected messages
async function* selectedMessagesList() {
  let page = await messenger.mailTabs.getSelectedMessages();
  for (let message of page.messages) {
    yield message;
  }

  while (page.id) {
    page = await messenger.messages.continueList(page.id);
    for (let message of page.messages) {
      yield message;
    }
  }
}

async function tagMessages(tag,key) {
    //console.log("Background: Tagging messages with ", tag, key);
    let messages = selectedMessagesList();
    for await (let message of messages) {
	//console.log("Background: tagging message", message.id) ;
        await messenger.messages.update(message.id, {
            tags: [...message["tags"], key]	
	});
    };
}

async function clearMessages(tag,key) {
    //console.log("Background: Clearing message tags.");
    let messages = selectedMessagesList();
    for await (let message of messages) {
	//console.log("Background: clearing message", message.id) ;
        await messenger.messages.update(message.id, {
            tags: []	
	});
    };
}

// The actual (asynchronous) handler for command messages.
async function commandHandler(message, sender) {
    let command = message.command ;
    let tag = message.tag ; // the tag as string (the way user sees it)
    let key = await getTagKey(tag)  ; // the internally used key for the tag, empty string if it doesnt exist
    //console.log("Background: Handling:", command, tag, key) ;
    if ((command == 'add') && (key != '')) {
 	await tagMessages(tag,key);
    }
    else if (command == 'new' && (key == '')) {
	key = addTag(tag) ;
 	await tagMessages(tag,key);
    }
    else if (command == 'clear') {
	await clearMessages();
    }
    return true;
}
