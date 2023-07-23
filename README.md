# Tagger

A Thunderbird extension to quickly tag selected messages using autocompletion.

(c) Jaap-Henk Hoepman (info@xot.nl)

Released under the [MIT](https://opensource.org/licenses/MIT) license. 

## Description

Tagger is a Thunderbird extension that allows you to quickly tag selected messages from a large list of existing tags using autocompletion. It also allows you to create and add new tags, or clear all currently set tags, on selected messages.

## Interface

Tagger installs a 'Tagger' button on Thunderbird's toolbar that opens a popup when clicked (or when pressing Ctrl-T on Windows or Command-T on Macos).

![Tagger interface](popup.png "Popup")

The popup contains a text input field to enter a tag string. While typing, a drop down list of all tags matching this string appears. The tag can be selected from this list by clicking with the mouse, or pressing the arrow down key repeatedly to select one and pressing the right arrow to complete it in the text input field (unfortunately without any visual feedback at the moment, see limitations below). Pressing the RETURN key adds the selected tag to the selected messages.

The four buttons in the popup perform the following functions:

- Add: adds an existing tag to the selected messages. Does nothing if the tag string currently entered does not exist. Pressing RETURN is the same as pressing the Add button.
- Create + add: creates a new tag and adds it to the selected messages. Does nothing if the tag string currently entered already exists.
- Clear: removes all tags from the selected messages.
- Close: closes the popup and does nothing. Pressing ESC or clicking outside the popup does the same.


## Limitations

- When selecting an option from the popup-list, the currently selected or hovered option is not highlighted, so it is hard to see what you select. This appears to be a bug in Thunderbird for which a [report has been filed](https://bugzilla.mozilla.org/show_bug.cgi?id=1844911).

- Internally, tags are represented (and stored as) keys. When created through the 'Manage tags...' interface or 'New tag...' pop-up, these keys use underscores (_) to replace spaces, allow hyphens (-) in tags, and use &xxx- notation to represent non-ASCII characters. Unfortunately, the current Thunderbird API does not allow creating such keys for new tags, meaning that
  the keys created for such complex tags using tagger are not portable to other installations of Thunderbird using the same tags (but created through the 'official' user interface). This is an issue when migrating mail folders (that store tag keys with the actual mails using the X-Mozilla-Keys header).
  A [bug report has been filed](https://bugzilla.mozilla.org/show_bug.cgi?id=1844747).
  
