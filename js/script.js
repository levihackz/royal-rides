/* ==========================================================================
   ROYAL RIDES - script.js
   Plain (vanilla) JavaScript. No libraries, no frameworks, no backend.

   Contents:
   1.  Contact details
   2.  Helper functions
   3.  Mobile navigation (hamburger menu)
   4.  Active navigation link
   5.  Smooth scrolling for on-page links
   6.  Booking form validation
   7.  WhatsApp booking message
   8.  Direct WhatsApp / call buttons
   9.  Area search filter
   10. FAQ accordion
   11. Scroll reveal animations (IntersectionObserver)
   12. Back to top button
   13. Footer year
   ========================================================================== */

/* Everything runs after the HTML has finished loading. */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /* ========================================================================
     1. CONTACT DETAILS
     One place to change the numbers. "display" is what people see,
     "whatsapp" is the international format WhatsApp links need
     (South Africa = country code 27, and the leading 0 falls away).
     ======================================================================== */

  var CONTACTS = {
    neren: {
      name: "Neren",
      display: "076 096 7502",
      dial: "+27760967502",
      whatsapp: "27760967502"
    },
    melaine: {
      name: "Melaine",
      display: "071 689 4748",
      dial: "+27716894748",
      whatsapp: "27716894748"
    }
  };

  /* Message used when someone taps a plain WhatsApp button
     (rather than filling in the booking form). */
  var DEFAULT_WHATSAPP_MESSAGE =
    "Hello Royal Rides,\n\n" +
    "I would like to enquire about employee transport.\n\n" +
    "Thank you.";


  /* ========================================================================
     2. HELPER FUNCTIONS
     ======================================================================== */

  /* Short way of writing document.querySelector */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  /* Returns a real array of elements so we can use forEach on it */
  function $all(selector, scope) {
    return Array.prototype.slice.call(
      (scope || document).querySelectorAll(selector)
    );
  }

  /* Builds a wa.me link with the message safely encoded for a URL */
  function buildWhatsAppLink(number, message) {
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  }

  /* Opens a link in a new browser tab */
  function openInNewTab(url) {
    window.open(url, "_blank", "noopener");
  }


  /* ========================================================================
     3. MOBILE NAVIGATION (HAMBURGER MENU)
     ======================================================================== */

  var navToggle = $("#navToggle");
  var navMenu = $("#navMenu");

  if (navToggle && navMenu) {
    /* Open and close the menu when the hamburger is tapped */
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("is-open");
      /* aria-expanded tells screen readers whether the menu is open */
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    });

    /* Close the menu after a link inside it is tapped */
    $all("a", navMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    /* Close the menu with the Escape key */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }


  /* ========================================================================
     4. ACTIVE NAVIGATION LINK
     Each page already marks its own link with class "is-active" in the HTML.
     This is a safety net: it checks the file name in the address bar and
     highlights the matching link if nothing is highlighted yet.
     ======================================================================== */

  var navLinks = $all(".nav__link");
  var alreadyMarked = navLinks.some(function (link) {
    return link.classList.contains("is-active");
  });

  if (!alreadyMarked && navLinks.length) {
    /* Work out the current file name, treating "/" as index.html */
    var path = window.location.pathname.split("/").pop() || "index.html";

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      if (href && href.split("#")[0] === path) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }


  /* ========================================================================
     5. SMOOTH SCROLLING FOR ON-PAGE LINKS
     CSS already does this, but this version also moves keyboard focus
     to the target so keyboard users do not get left behind.
     ======================================================================== */

  $all('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var targetId = link.getAttribute("href");

      /* Ignore a bare "#" which points nowhere */
      if (!targetId || targetId === "#") {
        return;
      }

      var target = document.getElementById(targetId.slice(1));
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      /* tabindex -1 lets a non-interactive element receive focus */
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });


  /* ========================================================================
     6 & 7. BOOKING FORM + WHATSAPP MESSAGE
     The form runs entirely in the browser. Nothing is saved anywhere and
     there is no server involved: the details are turned into a WhatsApp
     message that the visitor chooses to send.
     ======================================================================== */

  var bookingForm = $("#bookingForm");

  if (bookingForm) {
    var summaryBox = $("#bookingSummary");
    var previewBox = $("#bookingPreview");
    var sendNeren = $("#sendNeren");
    var sendMelaine = $("#sendMelaine");
    var editBooking = $("#editBooking");

    /* Holds the message built from the most recent valid submission */
    var currentMessage = "";

    /* --- Validation rules for each field --- */

    /* A South African number: 10 digits, or the same number with +27.
       Spaces and dashes are ignored while checking. */
    function isValidPhone(value) {
      var digitsOnly = value.replace(/[\s\-()]/g, "");
      return /^(0\d{9}|\+27\d{9}|27\d{9})$/.test(digitsOnly);
    }

    /* Shows a red message under one field */
    function showError(field, message) {
      var wrapper = field.closest(".form-field");
      var errorBox = $(".field-error", wrapper);
      wrapper.classList.add("has-error");
      field.setAttribute("aria-invalid", "true");
      if (errorBox) {
        errorBox.textContent = message;
      }
    }

    /* Clears the red message under one field */
    function clearError(field) {
      var wrapper = field.closest(".form-field");
      var errorBox = $(".field-error", wrapper);
      wrapper.classList.remove("has-error");
      field.removeAttribute("aria-invalid");
      if (errorBox) {
        errorBox.textContent = "";
      }
    }

    /* Checks one field and returns true if it is fine */
    function validateField(field) {
      var value = field.value.trim();

      if (field.hasAttribute("required") && value === "") {
        showError(field, "This field is required.");
        return false;
      }

      if (field.id === "fullName" && value.length < 2) {
        showError(field, "Please enter your full name.");
        return false;
      }

      if (field.id === "phone" && !isValidPhone(value)) {
        showError(field, "Enter a valid SA number, for example 071 234 5678.");
        return false;
      }

      clearError(field);
      return true;
    }

    /* Re-check a field as soon as the visitor leaves it */
    $all("input, select, textarea", bookingForm).forEach(function (field) {
      field.addEventListener("blur", function () {
        validateField(field);
      });
      field.addEventListener("input", function () {
        if (field.closest(".form-field").classList.contains("has-error")) {
          validateField(field);
        }
      });
    });

    /* Builds the WhatsApp message text from the form values */
    function buildBookingMessage(data) {
      return (
        "Hello Royal Rides,\n\n" +
        "I would like to request employee transport.\n\n" +
        "Name: " + data.fullName + "\n" +
        "Phone: " + data.phone + "\n" +
        "Pickup Area: " + data.pickup + "\n" +
        "Destination: " + data.destination + "\n" +
        "Shift: " + data.shift + "\n" +
        "Date: " + data.date + "\n" +
        "Additional Information: " + data.notes + "\n\n" +
        "Thank you."
      );
    }

    /* Turns 2026-03-14 into 14 March 2026 so the message reads naturally */
    function formatDate(value) {
      if (!value) {
        return "Not specified";
      }
      var parts = value.split("-");
      var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      var monthIndex = parseInt(parts[1], 10) - 1;
      if (!months[monthIndex]) {
        return value;
      }
      return parseInt(parts[2], 10) + " " + months[monthIndex] + " " + parts[0];
    }

    /* --- What happens on submit --- */
    bookingForm.addEventListener("submit", function (event) {
      /* Stop the browser from reloading the page: there is no backend */
      event.preventDefault();

      /* 1. Validate every field */
      var fields = $all("input, select, textarea", bookingForm);
      var firstInvalid = null;

      fields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (firstInvalid) {
        summaryBox.classList.remove("is-visible");
        firstInvalid.focus();
        return;
      }

      /* 2. Collect the values */
      var notes = $("#notes", bookingForm).value.trim();
      var data = {
        fullName: $("#fullName", bookingForm).value.trim(),
        phone: $("#phone", bookingForm).value.trim(),
        pickup: $("#pickupArea", bookingForm).value,
        destination: $("#destination", bookingForm).value,
        shift: $("#shift", bookingForm).value,
        date: formatDate($("#travelDate", bookingForm).value),
        notes: notes === "" ? "None" : notes
      };

      /* 3. Build the message and show it for review */
      currentMessage = buildBookingMessage(data);
      previewBox.textContent = currentMessage;
      summaryBox.classList.add("is-visible");
      summaryBox.scrollIntoView({ behavior: "smooth", block: "center" });
      summaryBox.setAttribute("tabindex", "-1");
      summaryBox.focus({ preventScroll: true });
    });

    /* 4. Sending: the visitor decides who to send the request to */
    if (sendNeren) {
      sendNeren.addEventListener("click", function () {
        openInNewTab(
          buildWhatsAppLink(CONTACTS.neren.whatsapp, currentMessage)
        );
      });
    }

    if (sendMelaine) {
      sendMelaine.addEventListener("click", function () {
        openInNewTab(
          buildWhatsAppLink(CONTACTS.melaine.whatsapp, currentMessage)
        );
      });
    }

    /* Hide the preview and go back to editing the form */
    if (editBooking) {
      editBooking.addEventListener("click", function () {
        summaryBox.classList.remove("is-visible");
        $("#fullName", bookingForm).focus();
      });
    }
  }


  /* ========================================================================
     8. DIRECT WHATSAPP / CALL BUTTONS
     Any element with data-whatsapp="neren" opens WhatsApp with a short
     enquiry message already typed in.
     ======================================================================== */

  $all("[data-whatsapp]").forEach(function (button) {
    var key = button.getAttribute("data-whatsapp");
    var person = CONTACTS[key];
    if (!person) {
      return;
    }

    /* Some of these are <a> tags, so set href where we can */
    var link = buildWhatsAppLink(person.whatsapp, DEFAULT_WHATSAPP_MESSAGE);

    if (button.tagName === "A") {
      button.setAttribute("href", link);
      button.setAttribute("target", "_blank");
      button.setAttribute("rel", "noopener");
    } else {
      button.addEventListener("click", function () {
        openInNewTab(link);
      });
    }
  });

  /* Call buttons simply use a tel: link */
  $all("[data-call]").forEach(function (button) {
    var person = CONTACTS[button.getAttribute("data-call")];
    if (person && button.tagName === "A") {
      button.setAttribute("href", "tel:" + person.dial);
    }
  });


  /* ========================================================================
     9. AREA SEARCH FILTER
     Types into the search box filter the area chips live.
     ======================================================================== */

  var areaSearch = $("#areaSearch");

  if (areaSearch) {
    var searchStatus = $("#searchStatus");
    var chips = $all("[data-area]");
    var panels = $all("[data-area-panel]");

    function filterAreas() {
      var term = areaSearch.value.trim().toLowerCase();
      var totalMatches = 0;

      chips.forEach(function (chip) {
        var name = chip.getAttribute("data-area").toLowerCase();
        var matches = term === "" || name.indexOf(term) !== -1;
        chip.classList.toggle("is-hidden", !matches);
        if (matches) {
          totalMatches += 1;
        }
      });

      /* Show a friendly note inside any panel that now has nothing in it */
      panels.forEach(function (panel) {
        var visible = $all("[data-area]", panel).filter(function (chip) {
          return !chip.classList.contains("is-hidden");
        });
        var emptyNote = $(".no-results", panel);
        if (emptyNote) {
          emptyNote.classList.toggle("is-visible", visible.length === 0);
        }
      });

      /* Update the line under the search box */
      if (searchStatus) {
        if (term === "") {
          searchStatus.textContent =
            "Showing all pickup areas and destinations.";
        } else if (totalMatches === 0) {
          searchStatus.textContent =
            'No area matches "' + areaSearch.value.trim() +
            '". Send us a message and we will check if we can reach you.';
        } else {
          searchStatus.textContent =
            totalMatches === 1
              ? "1 area matches your search."
              : totalMatches + " areas match your search.";
        }
      }
    }

    areaSearch.addEventListener("input", filterAreas);

    /* Escape clears the search box */
    areaSearch.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        areaSearch.value = "";
        filterAreas();
      }
    });

    filterAreas();
  }


  /* ========================================================================
     10. FAQ ACCORDION
     Opening one question closes the others.
     ======================================================================== */

  var faqItems = $all(".faq__item");

  faqItems.forEach(function (item) {
    var question = $(".faq__question", item);
    var answer = $(".faq__answer", item);

    if (!question || !answer) {
      return;
    }

    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");

      /* Close every question first */
      faqItems.forEach(function (other) {
        other.classList.remove("is-open");
        $(".faq__answer", other).style.maxHeight = null;
        $(".faq__question", other).setAttribute("aria-expanded", "false");
      });

      /* Then open this one, unless it was the one already open */
      if (!isOpen) {
        item.classList.add("is-open");
        /* scrollHeight is the answer's natural height, so it animates open */
        answer.style.maxHeight = answer.scrollHeight + "px";
        question.setAttribute("aria-expanded", "true");
      }
    });
  });


  /* ========================================================================
     11. SCROLL REVEAL ANIMATIONS
     ======================================================================== */

  var revealItems = $all(".reveal");

  if (revealItems.length) {
    /* Older browsers without IntersectionObserver just show everything */
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              /* Each element only needs to animate once */
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );

      revealItems.forEach(function (item) {
        observer.observe(item);
      });
    } else {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
    }
  }


  /* ========================================================================
     12. BACK TO TOP BUTTON
     ======================================================================== */

  var backToTop = $("#backToTop");

  if (backToTop) {
    window.addEventListener("scroll", function () {
      backToTop.classList.toggle("is-visible", window.scrollY > 420);
    });

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }


  /* ========================================================================
     13. FOOTER YEAR
     Keeps the copyright line correct without editing every page.
     ======================================================================== */

  $all("[data-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });
});
