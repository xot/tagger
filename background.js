/**
 * Part I: Handlign tagging popup
 */


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
    let tags = await messenger.messages.tags.list();
    let key = ''
    tags.forEach(element => {
    	if (element.tag === tag) {
    	    key = element.key
    	}
    });
    return key;
}

// create a key,tag pair, return true if succesful, false if not
async function createTag(key,tag) {
    try {
	await messenger.messages.tags.create(key,tag,"#000000");
	return true;
    } catch (error) {
	return false;
    }
}

// add a new tag to the database of Thunderbird tags; creates a unique key for
// this tag, which is returned as function result. (The key returned for tags
// with non-ASCII chacaters is NOT THE SAME as Thunderbird itself would create
// when creating this tag through Manage Tags... 
async function addTag(tag) {
    console.log("Popup: Adding new tag:", tag) ;
    // Create a unique key for the tag. This is not as easy as it seems
    // because Thunderbird really doesnt like keys with non-ASCII characters
    // (even though the API now allows such keys to be created).
    // Note TB has no problem with such characters in the tag itself.
    //
    // Our solution: trim the tag, replace ' ' with _, transform to UTF8,
    // make lowercase and remove all illegal chars; this creates its key
    let key = tag.trim() ;
    // space -> _
    key = key.replaceAll(/[ ]/g,'_') ;
    // to UTF8
    key = encodeURI(key);
    // TB does not like uppercase in keys
    key = key.toLowerCase(key) ;
    // replace any remaining non basic ASCII chars with x
    key = key.replaceAll(/[^-$a-zA-Z0-9_]/g,'x') ;
    //officially the below strategy should work, and indeed tags.create() would
    //accept any key without [ ()/{%*<>"], but Thunderbird doesn't grok such
    //keys in the end. So we use the above.
    //key = key.replaceAll(/[ ()/{%*<>"]/g,'x') ;
    console.log("Popup: Trying key:", key) ;
    // avoid collisions with existing keys just in case
    var success = await createTag(key,tag);
    while (! success) {
	key = key + "x" ;
	console.log("Popup: Trying key:", key) ;
	success = await createTag(key,tag);
    }
    console.log("Popup: Using key:", key) ;
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

// tag the currently selected messages with the tag using key
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

// remove all tags on the currently selected messages
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
	key = await addTag(tag) ;
 	await tagMessages(tag,key);
    }
    else if (command == 'clear') {
	await clearMessages();
    }
    return true;
}

/**
 * Part II: Automatically add tags on incoming replies using tags 
 * of message replied to.
 */

// The actual (asynchronous) handler for incoming email messages.
async function newMailHandler(folder,messageList) {
    var val = await messenger.storage.local.get('tagreplies') ;
    if (!val.tagreplies) {
	console.log("Tagger not tagging incoming reply.") ;
	return ;
    } 
    // get incoming message
    let message = messageList.messages[0] ;
    console.log("Tagger processing new message from", message.author.toLowerCase()) ;
    // get the full message
    let msg_part = await messenger.messages.getFull(message.id) ;
    // get the in-reply-to headers, if present
    if ('in-reply-to' in msg_part.headers) {
	let in_reply_tos = msg_part.headers['in-reply-to'] ;
	if (in_reply_tos.length > 0) {
	    // get first in-reply-to message id
	    let reply_message_id = in_reply_tos[0] ;
	    console.log("Reply to found:",reply_message_id ) ;
	    // strip < and >
	    reply_message_id = reply_message_id.substring(1,reply_message_id.length-1) ;
	    console.log("Stripped reply to:",reply_message_id ) ;
	    // find message with this message id
	    let result = await messenger.messages.query( {headerMessageId: reply_message_id} )
	    if (result.messages.length > 0) {
		// if found, add its tags to the incoming message
		let reply_msg = result.messages[0] ;
		let reply_tags = reply_msg.tags ;
		console.log("Tags found:",reply_tags,". Adding them.") ;
		messenger.messages.update(message.id, { tags: reply_tags }) 
	    }
	}
    }
}

// Handle incoming new message from a server
browser.messages.onNewMailReceived.addListener((folder, messageList) => {
    newMailHandler(folder,messageList);    
});
