ROYAL RIDES - images folder
===========================

This folder is where real photographs go once they are available.
Right now the site uses inline SVG illustrations instead of photos, so
nothing here is required for the website to work.

Suggested files to add later:

  triber-side.jpg      Side view of the Renault Triber
  triber-interior.jpg  Interior showing the seating
  logo.png             Royal Rides logo
  favicon.png          Small browser tab icon (32 x 32)
  og-image.jpg         Sharing image for WhatsApp / Facebook (1200 x 630)

HOW TO SWAP AN ILLUSTRATION FOR A REAL PHOTO
--------------------------------------------
1. Put the photo in this folder.
2. Open the page you want to change (for example index.html).
3. Find the block that starts with:  <svg viewBox="0 0 420 175"
4. Replace that whole <svg> ... </svg> block with:

   <img src="images/triber-side.jpg"
        alt="The Royal Rides 7-seater Renault Triber">

The surrounding gold frame, badge and caption will still work.

TO ADD A FAVICON
----------------
Add this line inside the <head> of every page:

   <link rel="icon" href="images/favicon.png">

TO ADD A SHARING IMAGE
----------------------
Add this line inside the <head>, below the other og: tags:

   <meta property="og:image" content="images/og-image.jpg">
