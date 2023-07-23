// Get a list of known tags; this is a list of elements containing a key
// and a tag; the key is a normalised version of the tag used internally
// by Thunderbird: no uppercase, and spaces changed to underscore.
//console.log('Popup: Getting tags')
let tags = await messenger.messages.listTags();

// construct an option list for the input selector
let knowntags = '';
tags.forEach(element => {
    knowntags = knowntags.concat('<option value="',element.tag,'" />');
});
// and set it
document.getElementById("tags").innerHTML = knowntags;

// send command and tag to background process to apply to selected messages
async function tagCommand(command) {
    // get the entered tag value
    let tag = document.getElementById("selectedtag").value ; 
    //console.log("Popup: Sending:", command, tag );
    await messenger.runtime.sendMessage({
	command: command,
        tag: tag
    });
    //console.log("Popup: Closing window") ;
    window.close();
}

// handle OK button press
function notifyOK(event) {
    tagCommand('add');
    // prevent the submit event from closing the form, see:
    // https://stackoverflow.com/questions/17331622/submit-form-wait-until-animation-has-finished
    // which would destroy the context in which the message passing system is
    // still running asynchronously.
    // tagCommand asynchronous execution will clsoe the window later
    event.preventDefault();
}

// handle New button press
function notifyNew(event) {
    tagCommand('new');
}

// handle Clear button press
function notifyClear(event) {
    tagCommand('clear');
}

// handle Cancel button press
function notifyCancel(event) {
    //console.log("Popup: Cancel pressed.");
    //console.log("Popup: Closing window") ;
    window.close();
}
    
// register the handlers
// (by creating a form, pressing return activates the submit action, while
//  esc cancels the form)
document.getElementById("inputform").addEventListener("submit", notifyOK);
document.getElementById("button_new").addEventListener("click", notifyNew);
document.getElementById("button_clear").addEventListener("click", notifyClear);
document.getElementById("button_cancel").addEventListener("click", notifyCancel);

// put focus on the tag input field 
document.getElementById("selectedtag").focus();
