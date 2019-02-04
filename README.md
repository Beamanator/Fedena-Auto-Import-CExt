# Fedena-Auto-Import-CExt

## Purpose
Adds the ability to automatically import student data into the Fedena student record system. Here are the fields that are currently supported:
- Required Fields:
    - Full name,
    - Date of Birth
    - UNHCR No
- Optional Fields:
    - Nationality
    - Gender
    - Phone no
    - Mobile no
    - Category
    - Parent full name
    - Parent relationship
    - Parent phone

**Important Note**: Spreadsheet columns name must exactly match the field names above, or else the import cannot tell which data you are importing!

## Where to Download
Chrome web store download: https://chrome.google.com/webstore/detail/fedena-extension-auto-cli/fkdgpcjhiieaobggeohdlknbdlflahmk
    
## Developer notes
1. This import was one of my first Chrome Extensions, so the message passing system may be a bit confusing.
1. This import uses Angular 1, which is super out of date but I haven't had time to learn future versions of angular.
