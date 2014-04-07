// ==UserScript==
// @name Facebook Demetricator
// @version 1.5.0
// @namespace facebookdemetricator
// @description Removes all the metrics from Facebook

// @updateURL http://bengrosser.com/fbd/facebookdemetricator.meta.js
// @downloadURL https://bengrosser.com/fbd/facebookdemetricator.user.js
//
//
// @match *://*.facebook.com/*
// @include *://*.facebook.com/*
// @exclude *://*.facebook.com/ai.php*
// @exclude *://*.facebook.com/ajax/*
// @exclude *://*.facebook.com/dialog/*
// @exclude *://*.facebook.com/connect/*
//
// @icon http://bengrosser.com/fbd/fbd-logo-32.png
//
// ==/UserScript==// -----------------------------------------


// -----------------------------------------------------------------
// Facebook Demetricator
// by Benjamin Grosser
// http://bengrosser.com
//
// Winner of a Terminal Award for 2012-13
// http://terminalapsu.org
//
// Version 1.5.0
// http://bengrosser.com/projects/facebook-demetricator/
//
// Major Exhibitions:
// 2012  Prospectives '12, University of Reno at Nevada
// 2013  The Public Private, Curated by Christiane Paul, at The New School
// 2013  MFA Thesis Exhibition, Krannert Art Museum, Champaign, IL
// 2013  Public Assembly, The White Building, London, UK
// 2014  Arte Laguna Finalist Exhibition, Telecom Italia Future Centre, Venice, Italy
// 2014  Theorizing the Web, Windmill Studios, Brooklyn, NY
// ------------------------------------------------------------------------------------


// THANKS to my beta test team!! 
// Selina, Hugh, Jeff, Dan B., Dan G., Keith, Ashley, Janelle, Elizabeth, Keri, Kate
//
// THANKS to my graph search beta test team!
// Joe, Molly
//


// TODO update graph search results demetrication since latest changes
// TODO fully demetricate new messages interface (have a few quick fixes for now)
// TODO photoTextSubtitle settings/public icon should stay showing
// TODO removing entries in people you may know needs to trigger on new entries
// TODO trigger for demetricateMessageMutualFriends()
// TODO uiTooltipX demetrication for like button popups.  can't figure it out right now


// globals
var startURL;                       // page that loaded the userscript                              
var curURL = '';                         // supposed url of the current page
var j;                              // jQuery
var demetricatorON = true;          // loads ON by default
var currentChatCount;               // tracks the chat count
var currentMoreChatCount;
var currentLikeCount;               // for tracking likes in the dialog
var currentTitleText;               // current (non-metric) count of $('title')
var timelineView = false;
var searchBarWidth = "300px";
//var newSearchBarWidth = 530;
var newSearchBarWidth = 400;
var newSearchBarWidthNarrow = 400;


// constants
var FADE_SPEED = 175;               // used in jQuery fadeIn()/fadeOut()
var ELEMENT_POLL_SPEED = 750;       // waitForKeyElements polling interval 
var RIBBON_TEXT_COLOR = "rgb(59,89,152)"; // TODO change this to opacity
var LINK_HIGHLIGHT_ON = false;      // debugging
var VERSION_NUMBER = '1.5.0';        // used in the console logging
var KEY_CONTROL = true;
var FAN_PAGE_URL = 'http://bengrosser.com';
//var DEMETRICATOR_HOME_URL = 'http%3A%2F%2Fbengrosser.com/projects/facebook-demetricator/';
var DEMETRICATOR_HOME_URL = 'http://bengrosser.com/projects/facebook-demetricator/';
var GROSSER_URL = 'http://bengrosser.com/';
var IS_SAFARI_OR_FIREFOX_ADDON = true;        // is this a Firefox or Safari addon?
var IS_FIREFOX_ADDON = true; // is this just Firefox?  Need to adjust some things for FF' slow performance
//var IS_SAFARI_EXTENSION = false;        // is this a Safari addon?
var DBUG = false;                   // more debugging
var FUNCTION_REPORT = true;        // rudimentary function reporting to the console
var HAS_GRAPH_SEARCH = false;       // does the user have graph search?


// setInterval element counts
var streamStoryCount = 0;
var timelineUnitCount = 0;
var commentCount = 0;
var photoGridCount = 0;
var favoritesCount = 0;
var friendBrowserCount = 0;
var notificationItemCount = 0;
var graphSearchPhotoCount = 0;
var graphSearchResultCount = 0;
var appSectionCount = 0;
var appSectionCountVER2 = 0;
var friendBlockCount = 0;
var friendBlockCountVER2 = 0;


// state
var demetricating = false;


// jQuery selectors that fade in/out on toggle
var fadeClasses = [
    '.facebookmetric_fade'
];


// jQuery selectors that hide/show on toggle
var hideShowClasses = [
    '.facebookmetric_hideshow',
    '.FriendRequestIncoming i',      // +1 part of '+1 Respond to Friend Request' buttons
    '.FriendRequestOutgoing i'      // +1 part of '+1 Respond to Friend Request' buttons
];


// some metrics need to be set to opacity:0 instead of hidden, so that the space 
// they occupy doesn't collapse
var opacityClasses = [
    '.fbtimelineblockcount',
    '.fbTimelineHeadlineStats',
    '.photoText .fsm.fwn.fcg',
    '.facebookmetric_opacity'
];
    

// sometimes metrics need to be swapped with something else (e.g. generic text)
// there are toggleON and toggleOFF classes, corresponding to demetrication states
var toggleOnOffClasses = [
    '.facebookmetric_toggle'
];


// cleaner syntax than match()
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };



// toggleDemetricator()
//
// called whenever the checkbox is toggled to fade/hide/show metrics in/out
// most of this is handled through the hiding/showing of classes that have already
// been inserted into FB's HTML via demetricate()
function toggleDemetricator() {

    if(demetricatorON) {

        if(DBUG) console.time('demetricatorON timer');

        // red/white top-left notification icons
        j('#jewelContainer span.facebookmetricreq').fadeOut(FADE_SPEED);
        j('#jewelContainer span.facebookmetricmsg').fadeOut(FADE_SPEED);
        j('#jewelContainer span.facebookmetricnot').fadeOut(FADE_SPEED);

        //
        // after fading the metric, hide its parent
        setTimeout(function() {
            j('.facebookmetricreqp').hide();
            j('.facebookmetricmsgp').hide();
            j('.facebookmetricnotp').hide();
        }, 500);

        // do this here so it happens before searchbar length changes
        demetricateHomeCount();

        // re-run demetricate() in case of new content
        if(FUNCTION_REPORT) console.log("calling demetricate from toggleDemetricator()");
        demetricate();

        // graph search
        if(HAS_GRAPH_SEARCH) {
            demetricateGraphSearchResults();
            demetricateGraphSearchSelectorOverview();
        }

        // fade out all selectors in fadeClasses
        j.each(fadeClasses, function(index, value) { j(value).fadeOut(); });

        // hide all selectors in hideShowClasses
        j.each(hideShowClasses, function(index, value) { j(value).hide(); });
        
        // hide all toggle classes in toggleOnOffClasses
        j.each(toggleOnOffClasses, function(index, value) { 
            j(value+'OFF').hide();
            j(value+'ON').show();
        });

        // lower right-hand corner chat button
//        j('.chatnumber').fadeOut(FADE_SPEED);

        // FB changes, 2/20/2012
        j('.fbNubButton span.label').hide();
        j('.fbNubButton span.fbdchatlabel').show();


        // drop-down on the timeline ribbon
        j('.fbTimelineMoreButton').find('.fbTimelineRibbon').find('.text').animate({color:"#fff"}, FADE_SPEED);

        // a few metrics need to fade out while holding their space
        j.each(opacityClasses, function(index, value) { j(value).animate({opacity:0}, FADE_SPEED); });

        // view all XX comments
        j('.fbviewallcomments').each(function() { j(this).attr('value',j(this).attr('newvalue')); });

        // timeline add friend +1 icons
        j('#pagelet_friends span.FriendLink i').hide();
        j('#pagelet_friends span.FriendLink a').css('padding-left','0px');

        // newsfeed attachment +1 icons
        j('.addButton i').not('.FriendRequestAdd').hide();
        j('.addButton').not('.FriendRequestAdd').css('padding-left','0px');

        // event and timeline activity counts (possibly elsewhere)
        j('.counter').fadeOut(FADE_SPEED);

        if(DBUG) console.timeEnd('demetricatorON timer');


    } 
    
    // else reveal all the previously demetricated metrics
    else {
        if(DBUG) console.time('demetricatorOFF timer');

        // removing the style attr on the parents enables care-free automatic updating 
        // of the notification numbers.  
        j('#jewelContainer span.facebookmetricreqp').removeAttr('style');
        j('#jewelContainer span.facebookmetricmsgp').removeAttr('style');
        j('#jewelContainer span.facebookmetricnotp').removeAttr('style');


        // do this here before search bar length changes
        j('.facebook_homecount').show();

        // only if the notification counts are > 0 do we want them to fade in
        // otherwise, remove the style attribute alltogether so it doesn't interfere w/ FB's 
        // method for updating the count and showing the number when it wants to
        if(parseInt(j('#requestsCountValue').text())) j('.facebookmetricreq').fadeIn(FADE_SPEED);
        if(parseInt(j('#mercurymessagesCountValue').text())) j('.facebookmetricmsg').fadeIn(FADE_SPEED);
        if(parseInt(j('#notificationsCountValue').text())) j('.facebookmetricnot').fadeIn(FADE_SPEED);

        var notificationsTotal = 
            parseInt(j('#requestsCountValue').text()) +
            parseInt(j('#mercurymessagesCountValue').text()) +
            parseInt(j('#notificationsCountValue').text());

        if(notificationsTotal) {
            j('title').text('('+notificationsTotal+') '+currentTitleText);
        } else {
            j('title').text(currentTitleText);
        }

        // fade in all fadeClasses
        j.each(fadeClasses, function(index, value) { j(value).fadeIn(); });

        // show all selectors in hideShowClasses
        j.each(hideShowClasses, function(index, value) { j(value).show(); });

        // show all toggle classes in toggleOnOffClasses
        j.each(toggleOnOffClasses, function(index, value) { 
            j(value+'ON').hide();
            j(value+'OFF').show();
        });

        // chat button count -- need to keep it updated. even though i've
        // hidden the element that FB updates with that info, it's still
        // there so we can query it to get the latest whenever needed
        /*
        currentChatCount = j('.fbNubButton').find('.count').text();
        j('.chatnumber').text(currentChatCount).fadeIn(FADE_SPEED);
        */

        // FB changes, 2/20/2012
        j('.fbNubButton span.fbdchatlabel').hide();
        j('.fbNubButton span.label').not('.fbdchatlabel').show();

        // timeline ribbon dropdown is too much trouble to hide/show due to how
        // FB updates it after clicking, so I instead animate its color for fade in/out
        j('.fbTimelineMoreButton').find('.fbTimelineRibbon').find('.text').animate({color:RIBBON_TEXT_COLOR});

        // view all XX comments - restore them to my previously stored count in the oldvalue attribute
        j('.fbviewallcomments').each(function() { j(this).attr('value',j(this).attr('oldvalue')); });

        // tiny +1 icons
        j('.facebookmetric_hideshow_plusone_img').show();
        j('.facebookmetric_hideshow_plusone_text').css('padding-left','18px');

        // timeline add friend +1 icons
        j('#pagelet_friends span.FriendLink i').show();
        j('#pagelet_friends span.FriendLink a').css('padding-left','18px');

        // newsfeed attachment +1 icons
        // STILL NEEDED? CONFLICTING WITH NEW PAGELET ESCAPE HATCH ON NEW TIMELINE 5/2013
        j('.addButton i').not('.FriendRequestAdd').show();
        j('.addButton').not('.FriendRequestAdd').css('padding-left','18px');

        // a few metrics need to fade out while holding their space
        j.each(opacityClasses, function(index, value) { j(value).animate({opacity:1}, FADE_SPEED); });

        // event and timeline activity counts, need to make sure they aren't 0 before revealing
        j('.counter').each(function() {
            var cnt = parseInt(j(this).text());
            if(cnt) j(this).fadeIn(FADE_SPEED);
        });


        if(DBUG) console.timeEnd('demetricatorOFF timer');

    }

    // for debugging, easily visualize whether the script sees dynamically 
    // inserted content by highlighting all links with red borders
    if(LINK_HIGHLIGHT_ON) {
        j('a').not('.facebooklink').addClass('facebooklink').css('border','1px solid red');
    } else {
        j('.facebooklink').css('border','0px solid red');
    }

    setTimeout(function() { 
        
        j('#fbdtoggleindicator').hide(); 
        // set the GS input bar back to our normal (reduced) width
        //j('#navFacebar').css('width','590px');
        //j('.fbFacebar').css('width','560px');

        // adjusting to new changes in nav items and that search results pages are narrower

        j('#navFacebar').css('width',searchBarWidth);
        j('.fbFacebar').css('width',searchBarWidth);


        // search results pages are narrower than all other pages
        if(startURL.contains("/search/")) {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidthNarrow+"px");
            j('._585-').css('width',newSearchBarWidthNarrow+"px");
        } else {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidth+"px");
            j('._585-').css('width',newSearchBarWidth+"px");
        }

    }, 250);

}



// main():
//
// gets run on first load of userscript, sets up all future function calls
// (either by binding them to interface elements or dynamic element emergence)
//
// note that 'first load' is less often w/ FB than some sites. clicks on links
// w/in FB that appear to load new pages (and thus would typically reload the
// userscript) are not truly new page loads, just dynamic rewritings.  therefore
// we use other techniques to detect those apparent page changes for demetrication
//
function main() {

    // store away the URL we landed on
    startURL = window.location.href;

    // Firefox/Safari Addons don't allow excludes in the URL match, so we do it here.
    if(IS_SAFARI_OR_FIREFOX_ADDON) {
        if(startURL.contains("ai.php") || 
           startURL.contains("/ajax/") ||
           //startURL.contains("/plugins/") || 
           startURL.contains("/dialog/") ||
           startURL.contains("/connect/")
           ) return; 
    }

    // added catch for the like button on my scaremail project dialog box, which was triggering demetricator
    if((startURL.contains("/plugins/") && !startURL.contains("bengrosser")) || startURL.contains("scaremail")) return;

    // console reporting
    console.log("Facebook Demetricator v"+VERSION_NUMBER);
    console.log("    --> "+startURL);

    // setup jQuery on j to avoid any possible conflicts
    j = jQuery.noConflict();

    // check for graph search
    if(j('body.hasSmurfbar').length) {
        HAS_GRAPH_SEARCH = true;
        console.log("Graph Search Detected");
        demetricateGraphSearchSelectorOverview();
        demetricateGraphSearchResults();
    }



    // store current chat count, then hide that count on the chat button
    //var chatobj = j('.fbNubButton:not("has([aria-label])")');
    /*
    var chatobj = j('.fbNubButton');
    currentChatCount = chatobj.find('.count').text();
    chatobj.find('.label').hide();
    chatobj.append(
        '<span class="chattext"> Chat <span class="chatnumber" style="display:none;">'+
        currentChatCount+'</span>'
    );
    */

    

    // debugging checkbox
    if(DBUG) var dbugcb = '<input type="checkbox" name="testcb1"'+
        'style="margin-top:10px;margin-right:5px;" />';
    else var dbugcb = '';
 
    var loading = '<img id="fbdtoggleindicator" class="loadingIndicator img" src="https://s-static.ak.facebook.com/rsrc.php/v2/yb/r/GsNJNwuI-UM.gif" alt="" width="16" height="11" style="margin-right:5px;">';

    var loading2 = '<li style="float:left;padding:0;margin:0;margin-top:8px;margin-right:5px;"> <img id="fbdtoggleindicator" class="loadingIndicator img" src="https://s-static.ak.facebook.com/rsrc.php/v2/yb/r/GsNJNwuI-UM.gif" alt="" width="16" height="11" style="margin-right: 5px; display: none; "></li>';

    // GS loading icon
    // added 20px left padding for new GS 5/2013, creates appropriate gap between new jewel left border and icon
    var GSloading2 = '<li style="float:left;padding:0;margin:0;margin-top:5px;margin-right:0px;"> <img id="fbdtoggleindicator" class="loadingIndicator img" src="https://s-static.ak.facebook.com/rsrc.php/v2/yb/r/GsNJNwuI-UM.gif" alt="" width="16" height="11" style="margin-right: 5px; display: none; padding-left:20px;"></li>';

    // the demetricator menu item and checkbox for the navbar
    var demetricatornavitem = loading2 + 
        '<li style="float:left;padding:0;margin:0;border:0px solid red;"><input id="demetricatortoggle" type="checkbox" checked="checked" name="demetricatordb" style="margin-top:5px;margin-right:5px;line-height:29px;"><a style="line-height:29px;margin-top:0px;padding-right:10px;color:#d8dfea;font-weight:bold;" id="demetricatorlink">Demetricator</a></li><li class="navItem firstItem"><a class="navLink" style="margin-left:0px;margin-right:3px"></a></li>';



    // ADDED 0px left border for latest GS and 'Ben's Timeline' insertion into navbar, 
    //   -- moved border into jewelsListItem
    //   -- updated margin-left to 15px for 5/2013 GS changes
    //   -- updated padding-right on demetricatorlink to 18px for 5/2013 GS changes
    // the demetricator menu item and checkbox for the GRAPH SEARCH navbar
    var GSdemetricatornavitem = GSloading2 + 
    //var GSdemetricatornavitem =
        '<input id="demetricatortoggle" type="checkbox" checked="checked" name="demetricatordb" style="margin-top:5px;margin-right:5px;margin-left:15px;line-height:29px;"><a class="navLink" style="padding-left:0px;border-left:0px;padding-right:18px;" id="demetricatorlink">Demetricator</a>';

    /*
     *
     * insert into bigPadding Home border-left #4e68aa and margin-left:0
     */
    // if navDivider is present
    /*
        '<input id="demetricatortoggle" type="checkbox" checked="checked" name="demetricatordb" style="margin-top:5px;margin-right:5px;margin-left:15px;line-height:29px;"><a class="navLink" style="padding-left:0px;border-left:0px;padding-right:18px;margin-right:0px;border-right:1px solid #385187" id="demetricatorlink">Demetricator</a>';
        */


    /* if not
        '<input id="demetricatortoggle" type="checkbox" checked="checked" name="demetricatordb" style="margin-top:5px;margin-right:5px;margin-left:15px;line-height:29px;"><a class="navLink" style="padding-left:0px;border-left:0px;padding-right:18px;" id="demetricatorlink">Demetricator</a>';

        */



    // NEW NEW navbar - something like this
    var newnewnavbarTRY1 = '<li class="navItem middleItem _55bi litestandNavItem _55bh"><img id="fbdtoggleindicator" class="loadingIndicator img" src="https://s-static.ak.facebook.com/rsrc.php/v2/yb/r/GsNJNwuI-UM.gif" alt="" width="16" height="11" style="display:none;margin:5px 5px 0 10px;"><a id="demetricatorlink" class="navLink bigPadding"><input id="demetricatortoggle" type="checkbox" checked="checked" name="demetricatordb" style="margin-top:5px;margin-right:5px;line-height:29px;margin-left:0px;">Demetricator<div class="_5ah- _5ahy"><div class="_5ahz"></div></div></a></li>';

    var newnewnavbar = '<li class="navItem middleItem _55bi litestandNavItem _55bh"><img id="fbdtoggleindicator" class="loadingIndicator img" src="https://s-static.ak.facebook.com/rsrc.php/v2/yb/r/GsNJNwuI-UM.gif" alt="" width="16" height="11" style="display:none;margin:5px 5px 0 10px;"><a id="demetricatorlink" class="navLink bigPadding" style="padding-left:4px;"><label id="demetricatortogglelabel" style="padding:5px;"><input id="demetricatortoggle" type="checkbox" checked="checked" name="demetricatordb" style="margin-top:0px;margin-right:0px;line-height:29px;margin-left:0px;z-index:100;"></label>Demetricator</a></div></li>';

    // if we have graph search, insert the new nav item
    if(HAS_GRAPH_SEARCH) {
        //j('#navHome .navLink').css('padding-left','0px');
        //`j('#navHome a').css('border-left','0px');
    // LATEST Before 1.5    j('#navHome').prepend(GSdemetricatornavitem);
        j('#navHome').before(newnewnavbar);
        //j('#navHome').before(GSdemetricatornavitem);
        //j('#jewelsListItem').append(GSdemetricatornavitem);
        // fixing for 3/20 FB update
        //j('#navFacebar').css('width','590px');
        //j('.fbFacebar').css('width','560px');
        
        // fixing for 5/2013 FB update
        // add a vertical right-hand border to the jewel buttons to demarcate from Demetricator toggle
        j('#jewelsListItem').css('border-right','1px solid rgb(77, 104, 167)');

        j('#navFacebar').css('width',searchBarWidth);
        j('.fbFacebar').css('width',searchBarWidth);

        if(j('#findFriendsNav').length) {
            newSearchBarWidth -= 100;
            newSearchBarWidthNarrow -= 100;
        }

        // search results pages are narrower than all other pages
        if(startURL.contains("/search/")) {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidthNarrow+"px");
            j('._585-').css('width',newSearchBarWidthNarrow+"px");
        } else {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidth+"px");
            j('._585-').css('width',newSearchBarWidth+"px");
        }

    } else {
        // insert the navigation control
        j('#pageNav').prepend(demetricatornavitem);
    }

    // Facebook Like Button for the Demetricator Project Homepage
    var likebutton = 
    '<iframe id="fbd_like_button" src="//www.facebook.com/plugins/like.php?href='+DEMETRICATOR_HOME_URL+'&amp;send=false&amp;layout=button_count&amp;width=90&amp;show_faces=false&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21&amp;data-ref=FBD_TOGGLE_STATE_ON" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:90px; height:21px;margin:30px 0px 25px 0px;" allowTransparency="true"></iframe>';

    // HTML for the dialog box
    var dialoghtml = 
        '<div style="display:none; width: 350px; height: 244px; margin: 0px auto; background-color: white;border:1px solid #e5e6e9;border-radius:3px;" class="-cx-PUBLIC-uiDialog__border" id="modaldialog">'+
        '<div style="margin:5px;" id="modalheader"> <label style="margin:5px;float:right;" class="simplemodal-close uiCloseButton"></label><br><br> </div> <center> <h1><a href="'+DEMETRICATOR_HOME_URL+'" target="_blank">Facebook Demetricator</a></h1> <span class="messageBody">Hides all the metrics on Facebook</span><br/>'
        +likebutton+
        '<h3><span class="fcg" style="font-weight:normal">by</span> Benjamin Grosser</h3> <span class="fsm fcg"><a href="'+GROSSER_URL+'" target="_blank">bengrosser.com</a></span> </center> <div id="modalfooter" style="margin:15px 25px 25px 25px;"> <p style="float:left;" class="fcg">version '+VERSION_NUMBER+'</p> <p style="float:right;" class="fcg"><a href="'+DEMETRICATOR_HOME_URL+'" target="_blank">More info/feedback...</a></p> </div> </div>';

    // insert the dialog into the page
    j('body').append(dialoghtml);
    
    // setup demetrication of the like button to activate whenever the dialog is loaded
    j('#demetricatorlink').click(function() {
        console.log("demetricator link click");
        if(demetricatorON) {
            var oldsrc = j('#fbd_like_button').attr('src');
            var newsrc = oldsrc.replace('FBD_TOGGLE_STATE_OFF','FBD_TOGGLE_STATE_ON');
            j('#fbd_like_button').attr('src',newsrc);
        } else {
            var oldsrc = j('#fbd_like_button').attr('src');
            var newsrc = oldsrc.replace('FBD_TOGGLE_STATE_ON','FBD_TOGGLE_STATE_OFF');
            j('#fbd_like_button').attr('src',newsrc);
        }

        j('#modaldialog').modal({
            opacity:65,
            overlayClose:true,
            overlayCss: {backgroundColor:"#000"}
        });
    });

    // keeps clicks on checkbox from triggering surrounding 'a' click
    j('#demetricatortogglelabel').click(function(event) { event.stopPropagation(); });

    // bind toggleDemetricator() to the checkbox
    j('#demetricatortoggle').change(function() {
        if(j(this).is(':checked')) demetricatorON = true;
        else demetricatorON = false;


        // need to reduce the width of the GS bar to accommodate
        // the toggle indicator gif
        //j('#navFacebar').css('width','560px');
        //j('.fbFacebar').css('width','530px');
        // 5/2013 update
        j('#navFacebar').css('width',searchBarWidth);
        j('.fbFacebar').css('width',searchBarWidth);

        if(startURL.contains("/search/")) {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidthNarrow-40+"px");
            j('._585-').css('width',newSearchBarWidthNarrow-40+"px");
        } else {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidth-40+"px");
            j('._585-').css('width',newSearchBarWidth-40+"px");
        }

        j('#fbdtoggleindicator').show();

        setTimeout(function() { 
            togglebeingchecked = false;
            toggleDemetricator(); 
        }, 250);
    });

    // debugging checkbox
    j('input[name=testcb1]').change(function() {
        if(j(this).is(':checked')) LINK_HIGHLIGHT_ON = true;
        else LINK_HIGHLIGHT_ON = false;
        toggleDemetricator();
    });


    // facilitates demetrication of the like button in the Demetricator dialog box
    if(startURL.contains('FBD_TOGGLE_STATE_ON')) {
        //j('.connect_widget_button_count_count').text('');
        
       // j('.pluginCountTextConnected').text('');
        //j('.pluginCountTextDisconnected').text('');
        //
        // works better with latest changes, should have done this in first place
        j('.pluginCountTextConnected').css('opacity','0');
        j('.pluginCountTextDisconnected').css('opacity','0');

        // if this is the dialog like button iframe, then we've done our job for now
        // removes an extra call to demetricate() on load
        return;
    }

    if(KEY_CONTROL) j(document).bind('keydown','ctrl+f',function() { 
        demetricatorON = !demetricatorON;
        console.log('Demetricator = '+demetricatorON); 
        toggleDemetricator();
    });

    // adjust search bar width to accomodate Demetricator menu item 
    // (they keep adding things to the default bar so this will create
    // some breathing room) .  
    j('#navSearch').css('width','321px');
    j('#q').css('width','285px');


    // FB changes, 2/20/2012
    /*
    j('.fbNubButton').append('<span class="fbdchatlabel" style="line-height:15px;">Chat</span>');
    j('.fbNubButton span.label').hide();
    */

    // remove the metrics from our landing page
    if(demetricatorON) {
        console.log("calling demetricate from main()");
        demetricate(launchPolling);
    }
}


// launchPolling()
//
// called via callback through demetricate(), used to launch a series 
// of persistent CSS element polls that watch for dynamically changed
// content in order to trigger various demetrications
//
function launchPolling() {

    console.log("main() demetricate done: in launchPolling()");

    // watch for new pages so we can recall demetricate as needed
    setInterval(checkForNewPage, ELEMENT_POLL_SPEED);


    // count the story blocks to know if there's new content to demetricate
    // catches additional pages of content when they're loaded, as well as 
    // new stories inserted at the top.  works better than triggering off
    // the morepager at the bottom because it catches top stories as well
    // also catches dynamically loaded ticker stories when hovered over (?)
    
    if(IS_FIREFOX_ADDON) COUNT_INTERVAL = 1500;
    else COUNT_INTERVAL = 800;

    COUNT_INTERVAL = 800;

    setInterval(function() { 
        var lateststorycount = j('.uiStreamStory, ._5jmm').length;
        var latesttimelineblockcount = j('.fbTimelineUnit').length;
        var latestphotogridcount = j('.fbPhotoStarGridElement').length;
        var latestfavoritescount = j('.uiFavoritesStory').length;
        var latestgraphsearchphotocount = j('._by0').length;
        var latestgraphsearchresultcount = j('._6a').length;

    //    console.log("lsc = "+lateststorycount);

        // new timeline
        var latestappsectioncount = j('.-cx-PRIVATE-fbTimelineAppSection__header').length;
        var latestappsectioncountVER2 = j('._3cz').length;

        // new timeline friend blocks
        var latestfriendblockcount = j('.-cx-PRIVATE-fbTimelineFriendsCollection__grid').length;
        var latestfriendblockcountVER2 = j('._262m').length;

        //var latestnotificationitemcount = j('.notification').length;
        //var latestfriendbrowsercount = j('.friendBrowserListUnit').length;
        // track followListItem for subscriber entries

        // TODO
        // streamStoryCount isn't getting triggered anymore b/c they changed the class
        
       
        if((
               lateststorycount > streamStoryCount || 
               latesttimelineblockcount > timelineUnitCount ||
               latestfavoritescount > favoritesCount
               ) 
           ) 
        {
            /*
            if(streamStoryCount == 0 && timelineUnitCount == 0 && favoritesCount == 0) {
                console.log("streamStory = timelineUnit = favorites = 0!!");
            }
            */

            // Firefox is so slow it chunks in new stories (during scroll) that it triggers
            // two demetrications when only one is needed.  this insures that if that all stories
            // from the new chunk haven't loaded yet, we just wait until it's finished. 
            //
            // ok, can't do this, this breaks demetrication of emerging stories. need to 
            // come up with alternative approach for FF
            //
            //if(lateststorycount <= streamStoryCount + 6) return;

            /*

            console.log("lateststorycount = " + lateststorycount);
            console.log("streamStoryCount = " + streamStoryCount);
            console.log("latesttimelineblockcount = " + latesttimelineblockcount);
            console.log("timelineUnitCount = " + timelineUnitCount);
            console.log("latestfavoritescount = " + latestfavoritescount);
            console.log("favoritesCount = " + favoritesCount);
            */

            setTimeout(function() { 
                if(demetricatorON) { 
                    if(FUNCTION_REPORT) console.log("calling demetricate() from lateststorycount poll"); 
                    demetricate(function() { 
                        if(FUNCTION_REPORT) console.log("demetricate from lsc finished."); 
                    }); 
                } 
            }, 25);
        }

        if(latestphotogridcount > photoGridCount) {
            setTimeout(function() { if(demetricatorON) demetricatePhotoIndex(); }, 250);
        }

        if(latestgraphsearchphotocount > graphSearchPhotoCount) {
            setTimeout(function() { if(demetricatorON) demetricatePhotoIndex(); }, 250);
        }

        if(latestgraphsearchresultcount > graphSearchResultCount) {
            setTimeout(function() { if(demetricatorON) demetricateGraphSearchResults(); }, 250);
        }

        if(latestappsectioncount > appSectionCount) {
            setTimeout(function() { if(demetricatorON) demetricateNewTimeline(); }, 250);
            // new timeline is SO SLOW that i'm running this again to catch stragglers -- #UGLYHACK
            setTimeout(function() { if(demetricatorON) { demetricateNewTimeline(); } }, 2000);
            setTimeout(function() { if(demetricatorON) { demetricateNewTimeline(); } }, 3000);
        }

        if(latestappsectioncountVER2 > appSectionCountVER2) {
            setTimeout(function() { if(demetricatorON) demetricateNewTimeline(); }, 250);
            // new timeline is SO SLOW that i'm running this again to catch stragglers -- #UGLYHACK
            setTimeout(function() { if(demetricatorON) { demetricateNewTimeline(); } }, 2000);
            setTimeout(function() { if(demetricatorON) { demetricateNewTimeline(); } }, 3000);
        }

        if(latestfriendblockcount > friendBlockCount || latestfriendblockcountVER2 > friendBlockCountVER2) {
            setTimeout(function() { if(demetricatorON) demetricateNewTimeline(); }, 250);
            // new timeline is SO SLOW that i'm running this again to catch stragglers -- #UGLYHACK
            setTimeout(function() { if(demetricatorON) { demetricateNewTimeline(); } }, 2000);
            setTimeout(function() { if(demetricatorON) { demetricateNewTimeline(); } }, 3000);
        }

        /*
        if(latestnotificationitemcount > notificationItemCount) {
            setTimeout(function() { if(demetricatorON) demetricateTimestamps(); }, 250);
        }
        */

        /*
        if(latestfriendbrowsercount > friendBrowserCount) {
            setTimeout(function() { demetricateFriendBrowserBlocks(); }, 250);
        }
        */

        timelineUnitCount = latesttimelineblockcount;
        streamStoryCount = lateststorycount;
        photoGridCount = latestphotogridcount;
        graphSearchPhotoCount = latestgraphsearchphotocount;
        graphSearchResultCount = latestgraphsearchresultcount;
        favoritesCount = latestfavoritescount;
        appSectionCount = latestappsectioncount;
        appSectionCountVER2 = latestappsectioncountVER2;
        friendBlockCount = latestfriendblockcount;
        friendBlockCountVER2 = latestfriendblockcountVER2;
        //notificationItemCount = latestnotificationitemcount;
        //friendBrowserCount = latestfriendbrowsercount;

    }, COUNT_INTERVAL);

    // graph search autosuggest results
    //if(HAS_GRAPH_SEARCH) waitForKeyElements('#typeahead_list_u_0_2', demetricateGraphSearchAutoSuggest, false); 
    if(HAS_GRAPH_SEARCH) waitForKeyElements('._21c', demetricateGraphSearchAutoSuggest, false); 
    //waitForKeyElements('#typeahead_list_u_0_1', demetricateGraphSearchAutoSuggest, false); 
    //waitForKeyElements('#u_0_3', demetricateGraphSearchAutoSuggest, false); 

    // notifications drop down timestamps
    waitForKeyElements('.notification, a.messagesContent', function() {
        demetricateTimestamps();
    }, false);

    // dynamic comment changes (insertions, likes, timestamps)
    waitForKeyElements('.UFIComment', function() {
        demetricateTimestamps();
        demetricateCommentLikeButton();
    }, false);

    // likes get updated dynamically
    //waitForKeyElements('.UFILikeSentence', demetricateLikesThis, false);

    // catches 'View All 4 Comments' when updated dynamically
    //waitForKeyElements('.UFIPagerLink span > span', demetricateViewAllComments, false);
    // FB update 2/20/2012
    waitForKeyElements('.UFIPagerLink span', demetricateViewAllComments, false);

    // friend-finder
    waitForKeyElements('.friendBrowserListUnit', demetricateFriendBrowserBlocks, false);

    // browser 'title' tag (e.g. tab title or window title, gets a notification metric: '(2) Facebook')
    setInterval(function() { 
        if(demetricatorON) demetricateTitle();
    }, 1000);

    // deals w/ what happens on an 'unlike' click -- needs a different trigger
    //waitForKeyElements('.UFILikeSentence a > span', demetricateLikesThis, false);
    // FB update 2/20/2012
    waitForKeyElements('.UFILikeSentence span a[rel="dialog"]', demetricateLikesThis, false);


    //waitForKeyElements('.UFILikeSentence span a[rel="dialog"]', demetricateLikesThis, false);

    /*
    waitForKeyElements('.UFILikeSentence span', function() {
        console.log('span');
    }, false);

    waitForKeyElements('.demetricatedlike', redemetricateLike, false);
    */

    /*
    waitForKeyElements('.likeparent', function() {
        console.log('likeparentWAIT');
    }, false);
    */

    /* blah */

    //waitForKeyElements('.UFILikeSentence', function() { console.log('#1'); }, false);
    //waitForKeyElements('.UFILikeSentence span a > span', function() { console.log('#2'); }, false);

    
    setInterval(function() {
        if(!demetricatorON) return;

        var brokenlikes = j('.demetricatedlike:not(:has(span))'); 
        var num = brokenlikes.length;

        if(num) {

            brokenlikes.each(function() {
                wrapNumberInString(this);
            });

            //console.log('fixed '+num+' broken like(s)');
        }

        var brokencomments = j('.demetricatedviewall:not(:has(span))');
        var cnum = brokencomments.length;

        if(cnum) {

            brokencomments.each(function() {
                var txt = j(this).text();
                var parsed = txt.match(/(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    j(this).html(
                        parsed[1] + '<span class="facebookmetric_hideshow facebookmetric" style="display:none"> '+
                        parsed[2] + '</span> ' +
                        parsed[3]
                        );
                } 
            });

            //console.log('fixed '+cnum+' broken view all comment(s)');
        }

    }, 2000);




    // friend list +1 icons within 'add friend' buttons
    waitForKeyElements('.fbProfileBrowserListItem, .fbProfileBrowserList', demetricateAddFriendButtons, false);
    waitForKeyElements('.detailedsearch_result', demetricateAddFriendButtons, false);

    // new timeline 5/2013
    waitForKeyElements('.FriendButton', demetricateAddFriendButtons, false);

    // search result items
    waitForKeyElements('ul.search li', demetricateSearchResultEntries, false);

    // thumbs-up like counts on comments
    waitForKeyElements('.UFICommentLikeButton', demetricateCommentLikeButton, false);

    // ego section (news feed sidebar)
    waitForKeyElements('.ego_column', demetricateEgoSection, false);

    // chat list (e.g. 'MORE ONLINE FRIENDS (8)')
    waitForKeyElements('.moreOnlineFriends', function() { 
        setTimeout(function() { demetricateChatSeparator(); }, 50);
    }, false);
    
    // Hovercards are dynamically generated, watch for them
    waitForKeyElements('.uiOverlayContent', demetricateHovercard, false);

    // chat tabs
    //waitForKeyElements('.fbMercuryChatTab', demetricateChatTab, false);
    waitForKeyElements('.fbNubButton', demetricateChatTab, false);

    // new 'related' boxes that show up after you click a link on the new new newsfeed
    waitForKeyElements('._5d73', function(jn) {
        jn.find('._4pp').not('.facebookcount').addClass('facebookcount facebookmetric_hideshow').hide();
    }, false);

    waitForKeyElements('.uiContextualLayer', function(jn) {
        //console.log('tooltip: '+jn.html()); 
        /*
            var aria = jn.html();
            var parsed = aria.match(/(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                jn.html(parsed[1]+
                        '<span style="display:none;" class="facebookmetric_hideshow"> '+parsed[2]+'</span> '+parsed[3]);
            }
        */

        var friendslink = jn.find('._7lo a[rel="dialog"]').not('.HovercardMessagesButton');

        /*
        if(friendslink && friendslink.not('span.hovercardcount') && friendslink.not('.HovercardMessagesButton')) {
            console.log('in fl tst');
            var html = friendslink.html();
            if(html) {
                var parsed = html.match(/^(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    if(demetricatorON) var disp = "display:none;";
                    else var disp = "";
                    var newhtml = '<span class="hovercardcount" style="'+disp+'">'+parsed[1]+"</span> "+parsed[2];
                    friendslink.html(newhtml);
                }
            }
        }
        */

        jn.find('a[rel="dialog"], div.fsm.fwn.fcg, div.fsm.fwn.fcg a div').not('.fbhovercardcount, .HovercardMessagesButton, .uiButton').each(function() {
            j(this).addClass('fbhovercardcount WHAT2');
            var txt = j(this).text();
            if(txt.contains('mutual') || txt.contains('subscribe') || txt.contains('going') || 
               txt.contains('other') || txt.contains('friends')) 
            var html = friendslink.html();
            
            if(html && friendslink.not('.HovercardMessagesButton, .uiButton')) {
                
                var parsed = html.match(/^(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    if(demetricatorON) var disp = "display:none;";
                    else var disp = "";
                    var newhtml = '<span class="hovercardcount HERE8" style="'+disp+'">'+parsed[1]+"</span> "+parsed[2];
                    friendslink.html(newhtml);
                }
                //else wrapNumberInString(this);
                else {
                         var txt2 = j(this).html();
        //txt = txt.replace(/\u200e/g,'');
        if(txt2) {
            var parsed = txt2.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            //var parsed = txt.match(/^(\d+(?:,\d+)*)[\s\u200e]+(.*)/);
            if(parsed) {
                j(this).html(
                    //'<span style="display:none;" class="facebookmetric_hideshow">'+parsed[1]+'</span> '+parsed[2]);
                    '<span style="display:none;" class="hovercardcount HERE9">'+parsed[1]+' </span>'+parsed[2]);
            }
        }
        j(this).addClass('facebookcount');
                }
            }
            // need to implement my own wrapnumber to insert a span like above so demetrication works
            else { 
                wrapNumberInString(this);
                //j(this).addClass('hovercardcount');
            }
            //if(j(this).text().contains('mutual') ) wrapNumberInString(this);
        });

    }, false);

    //waitForKeyElements('#ariaPoliteAlert',demetricateAriaAlert, false);
}


// demetricateTitle() 
// called by launchPolling() and demetricate()
// removes the parenthetic prefix on the 'title' tag
// stores the rest of the title for later restoration
function demetricateTitle() {
    var currentTitle = j('title');
    var txt = currentTitle.text();
    var parsed = txt.match(/^(\(\d+(?:,\d+)*\))\s(.*)/);
    //console.log('dT(): title= '+txt+', parsed='+parsed);
    if(parsed) { 
        currentTitle.text(parsed[2]);
        if(currentTitleText != undefined) currentTitleText = parsed[2];
        else currentTitleText = 'Facebook';
    }
}




// -------------
// DEMETRICATE()
// -------------
//
// demetricate() tags and then hides all metrics from the facebook interface
// the tags are used are by toggleDemetricator() to show/hide them as requested
function demetricate(callback) {
    if(demetricating) return;
    else demetricating = true;

    curURL = window.location.href;


    // DBUG
    if(DBUG) console.time('demetricator timer');

    // ---------------------------------------
    // -- GLOBAL METRICS (OCCUR EVERYWHERE) --
    // ---------------------------------------

    // BROWSER/TAB TITLE BAR
    demetricateTitle();

    // NOTIFICATIONS / NAVBAR
    demetricateNotifications();

    // TIMESTAMPS
    demetricateTimestamps();

    // PAGERS
    demetricatePagers();
    
    // COMMENTS - comment like buttons, also called via waitForKeyElements
    demetricateCommentLikeButton();

    // COMMENTS - 'View all 8 commments'
    demetricateViewAllComments();

    // COMMENTS - comment like buttons, also called via waitForKeyElements
    //demetricateLikesThis(j('.UFILikeSentence span a[rel="dialog"]'));
    demetricateLikesThis();

    // COUNTERS (left hand col counts (messages, events, etc.) and other places
    demetricateCounters();

    // CHAT
    demetricateChatSeparator();

    // SHARES
    demetricateShareCount();

    // NEWS FEED
    if(j('body.home').length) {
        demetricateNewsfeed();
    }

    // TIMELINE
    if(j('body.timelineLayout').length) {
        demetricateTimeline(); 
    } 

    // NEW PAGE/INTERESTS LAYOUT ... hybrid of newsfeed and pages.  arrgh
    if(j('body.pagesTimelineLayout').length) {
        demetricateNewsfeed(); 
    }

    // permalink posts 
    if(j('body.permalinkBody').length) {
        demetricateNewsfeed();
        demetricateTimeline(); 
    }

    // MUSIC
    if(curURL.contains('music')) demetricateMusic();

    // SEARCH RESULTS page
    demetricateSearchResult(j('.detailedsearch_result'));

    // APP CENTER
    if(j('body.app_center').length) {
        demetricateAppCenter();
    } 

    // EVENTS/CALENDAR 
    // new new event_navigation_header ... seems event pages lost body classes for ID
    if(j('body.fbCalendar').length || j('body.fbEventPermalink').length || j('#event_navigation_header').length) {
        demetricateEvents();
    } 

    // GROUP pages
    if(curURL.contains('groups') || startURL.contains('groups')) { 
        demetricateGroups(); 
    } 

    if(curURL.contains('yearinreview') || startURL.contains('yearinreview')) {
        demetricateYearInReview();
    }

    // MESSAGES
    if(curURL.contains('messages')) demetricateMessages();

    // HOVERCARD TOGGLE TRIGGERS
    // images that trigger hovercards (such as friend photos on the timeline ribbon)
    j('.hovercard_trigger').mouseenter(toggleHovercards);

    // links also trigger hovercards (such as lists of friends in the old-style profile) 
    j('a[data-hovercard]').mouseenter(toggleHovercards);
    
    // DEBUG
    if(LINK_HIGHLIGHT_ON) j('a').not('.facebooklink').addClass('facebooklink').css('border','1px solid red');
    if(DBUG) console.timeEnd('demetricator timer');

    // stragglers -- catching some things that might be left behind by above 
    // (items that have so little defining information that i didn't want to leave
    // such broad selectors higher up)
    j('.UIImageBlock_Content a.uiLinkSubtle[rel="dialog"]').not('.facebookcount').addClass('facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // like this and talking about this counts on OLD interest page styles 
    // (still around for some users as of 11/6/2012)
    j('.uiNumberGiant').not('.facebookcount').
        addClass('facebookcount facebookmetric_opacity').
        css('opacity','0');

    // reloaded photo pages tag overlays.  show up on ego_page in the body...not sure if i should catch this
    // here or elsewhere.  this will do for now
    // tag count on photo tag overlays
    j('.tagPhotoLink a.uiLinkLightBlue').not('.facebookcount').
        addClass('facebookcount facebookmetric_hideshow').hide();

    // CALLBACK for launchPolling()
    if(callback) callback();

    demetricating = false;
} // end demetricate()




    // -----------------------
    // -- UTILITY FUNCTIONS --
    // -----------------------
    //

    
    // need to mod or remove
    function tagAndStyleMetric(jnode, regex, tagclass, metricposition, style) {
        var txt = jnode.html();
        if(txt) {
            var parsed = txt.match(regex);
            if(parsed) {
                var newhtml = '';
                var newmetric = 
                    '<span class="'+tagclass+'" style="'+style+'">'+parsed[metricposition]+'</span>';

                if(metricposition == 1) {
                    newhtml = newmetric + parsed[2];
                } else if(metricposition == 2) {
                    newhtml = parsed[1] + newmetric;
    //                if(parsed[3]) newhtml += parsed[3];
                }

                jnode.html(newhtml);
            }
        }
    }


function demetricateShareCount() {
    // newsfeed item share counts
    //j('.UFIShareLink span').not('.facebookcount').each(function() {
    // FB update 2/20/2012
    j('.UFIShareLink').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });
}

// NEWS FEED
function demetricateNewsfeed() {

    if(FUNCTION_REPORT) console.log("demetricateNewsfeed()");

    // STILL NEEDED? - moved to demetricateCommentLikeButton()
    // large comment block counts (e.g. '50 of 152')
    //j('.ufiCommentCount').not('.fbsharecount').addClass('fbsharecount').addClass('facebookmetric_hideshow').hide();


    // some newsfeed items, perhaps only those that aren't from a close friend (e.g. friend of
    // friend, or from a liked page/business, etc...) include abbreviated bars of info for
    // likes, shares, and comments.  this should remove all those counts
    // moved to egosection
    //j('.uiBlingBox .text').not('.facebookmetric_fade').addClass('facebookmetric_fade').css('display','none');


    // a new way they do it, may be able to remove above
    j('.UFIBlingBoxText').not('.facebookmetric_fade').addClass('facebookmetric_fade').css('display','none');


    // +1 icons
    j('.facebookmetric_hideshow_plusone_img').hide();
    j('.facebookmetric_hideshow_plusone_text').css('padding-left','0px');


    // ad like counts
    // #pagelet_ego_pane span.fbEmuContext
    /*
    j('.fbEmuContext').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });
    */

    demetricateEgoSection();


    // ad 'claimed' counts (e.g. as in some kind of 'offer').  comes with a preceeding bullet, such as
    // ' · 155,387 claimed' ... i've seen it structured in other ways previously but can't find it now
    // may still need to add some code to this one later
    j('.couponAdsLink').next().not('.fbclaimedcount').each(function() {
        j(this).addClass('fbclaimedcount');

        // returns only the text element of a container that also has other wrapped elements
        // used by the demetrication routine for /name/favorites to remove people like this counts
        j.fn.justtext = function() { return j(this).clone() .children() .remove() .end() .text(); };

        var children = j(this).children();
        var txt = j(this).justtext();
        if(txt.contains('claimed')) {
            //var parsed = txt.match(/^(\s·\s)(\d+(?:,\d+)*)\s+(.*)/);
            var parsed = txt.match(/^(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
            var newtxt = 
                parsed[1]+ '<span style="display:none;" class="facebookmetric_hideshow"> '+
                parsed[2]+'</span> '+
                parsed[3];
            j(this).html(children).append(newtxt);
        }
    });

    j('.couponPlainText').not('.fbcount').each(function() {
        wrapNumberInString(this);
    });


    // trending articles block counts (range: '1 of 3')
    // TODO preceeding bullet ' . ' should go too
    j('.ogAggregationHeaderTitleContainer').find('.rangeText').not('.facebookcount').
        addClass('facebookcount facebookmetric_fade').hide();


    // trending articles '### people read this'
    j('span.ogSingleStoryStatusContent.rfloat').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // trending articles '### people shared this'
    j('.ogAggregationSubstoryContent .rfloat').not('.facebookcount').each(function() {
        wrapNumberInString(this);
        j(this).find('.facebookmetric_hideshow').css('color','inherit');
    });

    // like thumbs up counts on 'thing' blocks
    j('.ogAggregationSubstoryContent ._14a_ span').not('.facebookcount').
        each(function() {
            j(this).addClass('facebookcount facebookmetric_hideshow').hide();
    });
        


    // birthday extras (e.g. John Doe and 3 others)
    j('.fbRemindersTitle').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');

        var txt = j(this).text();

        // sometimes fbRemindersTitle isn't an 'others' count
        if(txt.contains('other')) {
            var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(
                    '<span style="display:none;" class="facebookmetric_hideshow">'+parsed[1]+'</span> '+parsed[2]);
            }
        }
        
    });


    // all counts in the reminders box on the right-hand side of the newsfeed (e.g. '4 events today')
    j('.fbRemindersTitle').find('strong').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });


    // +1 add button on newsfeed attachment items
    j('.addButton i').not('.FriendRequestAdd').hide();
    j('.addButton').not('.FriendRequestAdd').css('padding-left','0px');


    // news feed headlines that count up tagged members, such as 
    // 'John Doe posted a video -- with Joe Blow and 10 others'
    // TODO: needs some cleanup...we don't need to alter the HTML here, just the inline text
    // might need a new function to handle that job, but this is giving hte right visual for hte moment
    j('.uiStreamMessage').find('a[data-hover="tooltip"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });


    // shared item single-page views (e.g. ' · 157 like this')
    j('.subscribeOrLikeSentence span').not('.fbsingleitemsharecount').
        addClass('fbsingleitemsharecount').each(function() {
            var txt = j(this).text();
            if(txt.contains('like this')) {
                var parsed = txt.match(/^(.*\s)(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    var newhtml = parsed[1] + 
                        '<span class="facebookmetric_toggleOFF" style="display:none;">'+parsed[2]+'</span> '+
                        '<span class="facebookmetric_toggleON">people</span> '+
                        parsed[3];  
                    j(this).html(newhtml);
                }
            } else if(txt.contains('followers')) {
                parsed = txt.match(/(.*·)\s+(\d+(?:,\d+)*)(.*)/);
                if(parsed) {
                    j(this).html(
                        parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+
                        parsed[2]+'</span>'+
                        parsed[3]
                    );
                }
            }
    });

    /*
    j('.fbfollowitem span').not('.facebookcount').each(function() {
        var txt = j(this).text();

        if(txt.contains('followers')) {
            parsed = txt.match(/(.*·)\s+(\d+(?:,\d+)*)(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+
                    parsed[2]+'</span>'+
                    parsed[3]
                );
            }
        }
    });
    */

    // suggested page people like this metrics
    j('.socialContext').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        wrapNumberInString(this);
    });

    // newsfeed event blocks '8 people are going'
    j('._8m .mtm, ._42ef .mtm').not('.facebookcount').each(function() { 
        j(this).addClass('facebookcount');
        txt = j(this).html();

        if(txt.contains('people')) {
            parsed = txt.match(/(.*·)\s+(\d+(?:,\d+)*)(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+
                    parsed[2]+'</span>'+
                    parsed[3]
                );
            }
        } 
    });



    // comment-posted URL attachment like counts
    j('.uiAttachmentDetails').not('.fblikethiscount').
        addClass('fblikethiscount').each(function() {
        var txt = j(this).text();

        if(txt.contains('like this')) {
                var newhtml = 
                    '<span class="facebookmetric_toggleOFF" style="display:none;">'+txt+'</span> '+
                    '<span class="facebookmetric_toggleON">people like this</span> ';
                j(this).html(newhtml);
        }

        else if(txt.match(/\d/)) {
            j(this).addClass('facebookmetric_hideshow').hide();
        }
    });



    // newsfeed story headlines that contains photos added counts (e.g. 'soandso added 8 new photos.')
    // (was h6, now h5)
    // ._5jmm new new newsfeed
    j('.uiStreamStory h5, ._5jmm h5').not('.fbstreamheadline').each(function() {
        j(this).addClass('fbstreamheadline');
        var txt = j(this).text();
        
        // 'added 3 photos'
        if(txt.contains('added')) {
            //var parsed = txt.match(/^(.*)\s+(\d+(?:,\d+)*)(.*)/);
            //var parsed = txt.match(/^(.*added\s+)(\d+(?:,\d+)*)\s+(new.*)/);
            var parsed = txt.match(/^(.*added\s+)(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(parsed[1]+'<span class="facebookmetric_hideshow" style="display:none;"> '+parsed[2]+
                    ' </span>'+parsed[3]);
            }
        } 
        


        // instagram
        if(txt.contains('Instagram') && txt.contains('took')) {
            txt = j(this).html();
            var parsed = txt.match(/^(.*took\s+)(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(parsed[1]+'<span class="facebookmetric_hideshow" style="display:none;"> '+parsed[2]+
                    ' </span>'+parsed[3]);
            }
        }

        // new style
        else if(txt.contains('photo')) {
            var pl = j(this).find('.prounoun-link');
            if(pl) wrapNumberInString(pl);
        }

        
        // a different way of listing the # of photos in a stream story headline (oh fun)
        // a less logical structure than other ways they do it
        var nextitem = j(this).find('span.fcg');

        if(nextitem) {
            var nexthtml = nextitem.html();
            if(nexthtml) {
                if(nexthtml.contains('photos)')) {
                    var parsed2 = nexthtml.match(/^(.*)(\s+\()(\d+(?:,\d+)*)\s+(.*)/);
                    if(parsed2) {
                        nextitem.html(parsed2[1]+parsed2[2]+
                            '<span class="facebookmetric_hideshow" style="display:none;">'+
                            parsed2[3]+
                            ' </span>'+parsed2[4]
                        );
                    }
                }
            }
        }

        //var another = j(this).find('.passiveName');

    });


    // newsfeed attachment like counts (e.g. 'Someone and 17 others like this')
    j('.uiAttachmentDesc a[data-hover="tooltip"]').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).text();
        var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
        if(parsed) {
            j(this).html(
                '<span style="display:none;" class="facebookmetric_hideshow">'+parsed[1]+'</span> '+parsed[2]);
        }
    });


    // new Page people like this counts
    j('._508a').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // new new event pages in newsfeed get going counts
    j('.__cz a._6ld').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });


    // facebook questions stats
    j('.fbQuestionsBlingBox span.fsm').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount facebookmetric_hideshow').hide();
    });

    // more post pagers ('See 2 more posts from/about')
    j('.uiStreamShowAll a span').not('.facebookcount').each(function() {
        j(this).addClass('.facebookcount');
        var txt = j(this).text();
        if(txt) {
            var parsed = txt.match(/^(See)\s+(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1]+
                    ' <span class="facebookmetric_hideshow" style="display:none;">'+
                    parsed[2]+
                    ' </span>'+
                    parsed[3]
                    );
            }
        }
    });

} // end demetricateNewsfeed()


function demetricateNewTimeline() {

    // ####
    // ALL TIMELINE PAGES
    // ####
    
    // timeline header counts (about, photos, etc.)
    j('.-cx-PRIVATE-fbTimelineNavLight__sublabel, ._gs6').each(function() {
        j(this).addClass('facebookcount facebookmetric_opacity').
            css('opacity','0');
    });


    // ####
    // MAIN TIMELINE PAGE
    // ####
    //
    // note the two different queries for each search --- due to my finding that there are 
    // currently (at least) two different versions of the 'new' timeline coming up right now

    // timeline report block counts (e.g. photos, friends, music, etc.)
    j('.-cx-PRIVATE-fbTimelineLightReportHeader__text span.fcg, ._71u span.fcg').each(function() {
        j(this).addClass('facebookcount facebookmetric_opacity').
            css('opacity','0');
    });

    // 'followed by XX people' in about unit top of timeline
    j('.-cx-PRIVATE-fbTimelineAboutUnit__title a, ._4_ug a').each(function() {
        var txt = j(this).text();
        if(txt.contains("people")) {
            wrapNumberInString(this);
        }
    });

    // group block report member counts (e.g. '84 members')
    j('.-cx-PRIVATE-ogAppReport__listview li div div.fcg, ._1ln2 li div.fcg').each(function() {
        var txt = j(this).text();
        if(txt.contains("members")) {
            wrapNumberInString(this);
        }
    });

    // group block report member counts on the About page (e.g. '84 members')
    j('.-cx-PRIVATE-fbTimelineMedley__sectionwrapper li div div.fcg, ._1ln2 li div.fcg').each(function() {
        var txt = j(this).text();
        if(txt.contains("members")) {
            wrapNumberInString(this);
        }
    });

    // ####
    // ABOUT TIMELINE PAGE
    // ####
    //
    

    // NEED TO TRIGGER with latestSomethingCount

    // App Block header Counts 
    // e.g. Friends: (friends, followers, college, recent, etc.)
    // e.g. Places: (all, life event, recent, etc.)
    j('.-cx-PRIVATE-fbTimelineAppSection__tabcount, ._3d0').each(function() {
        j(this).addClass('facebookcount facebookmetric_opacity').
            css('opacity','0');
    });

    // Friend Block mutual friend and friend counts
    j('.-cx-PRIVATE-fbTimelineFriendsCollection__friend a.uiLinkSubtle, ._698 a.uiLinkSubtle').each(function() {
        var txt = j(this).text();
        if(txt.contains("friend")) {
            wrapNumberInString(this);
        }
    });

    // group block member counts
    j('.-cx-PRIVATE-uiFlexibleBlock__flexibleContent div.mbs.fcg, ._42ef div.mbs.fcg').each(function() {
        var txt = j(this).text();
        if(txt.contains("member")) {
            wrapNumberInString(this);
        }
    });

    // bling counts on Instagram stories
    j('.-cx-PUBLIC-ogAggregationBling__component span').not('.facebookcount').
        each(function() {
            console.log("HERE");
            j(this).addClass('facebookcount facebookmetric_opacity').css('opacity','0');
    });


    // catches Places map on this page
    demetricateMapBubbles();


    // 'Do you know Soandso?' boxes at the top of others' timelines may have mutual friend
    // counts
    j('#pagelet_escape_hatch a.uiLinkSubtle span.fsl.fcg').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });
       

    // friend requests block count (red/white) - new timeline
    j('.-cx-PRIVATE-uiCountButtonCount__root').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount facebookmetric_opacity').css('opacity','0');
    });


        // album page individual albums photo counts (facebook.com/username/photos)
    j('.photoText .fsm.fwn.fcg').not('.facebookcount').addClass('facebookcount').css('opacity','0');
    
    /*
    j('.photoText .fsm.fwn.fcg').not('.facebookcount').each(function() {
        wrapNumberInString(j(this));
    });
    */
    
    /*
    j('.photoText .fsm.fwn.fcg').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).html();
        var astore = j(this).find('a');
        console.log("txt: "+txt);
        console.log("a: "+astore);
    });
    */

    // also happens on the new timeline
    // some newsfeed items, perhaps only those that aren't from a close friend (e.g. friend of
    // friend, or from a liked page/business, etc...) include abbreviated bars of info for
    // likes, shares, and comments.  this should remove all those counts
    j('.uiBlingBox .text').not('.facebookmetric_fade').addClass('facebookmetric_fade').css('display','none');
    j('.UFIBlingBoxText').not('.facebookmetric_fade').addClass('facebookmetric_face').css('display','none');


}

// handles all Timeline-type views (profile, photos, subscribers, likes, etc.)
function demetricateTimeline() {
    if(FUNCTION_REPORT) console.log("demetricateTimeline()");

    // TEMPORARY TODO: find a better location for this
    demetricateNewTimeline();
    //return;


    // ----------------------------------
    // -- TIMELINE STORY BLOCK REPORTS --
    // ----------------------------------

    // timeline block reports (joined 2 events, 8 friends, with 50 other guests, visited 2 places, etc.)
    var tlreportcontentclass = j('.timelineReportContent');

    // if there are any at all, deal with them
    if(tlreportcontentclass.length) {

        // timeline block reports, friend counts, event counts (e.g. 'Joined 2 Events' or '8 Friends')
        tlreportcontentclass.find('.aboveUnitContent').find('a[rel="dialog"]').
            not('.fbtimelinecount').each(function() {
                j(this).addClass('fbtimelinecount');

                var txt = j(this).text();
                if(txt.contains('Friend') || txt.contains('Event') || txt.contains('Group')) {

                    // wrap the count
                    var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);

                    if(parsed) {
                        j(this).html('<span class="facebookmetric_hideshow" style="display:none;">'+
                            parsed[1]+'</span> '+parsed[2]);
                    }
                }
        });


        // timeline visited block reports, individual attended items, such as 'With 50 other guests'
        tlreportcontentclass.find('.uiList').find('a[rel="dialog"]').
             not('.fbtimelinecount').each(function() {
                 j(this).addClass('fbtimelinecount');

                 var txt = j(this).text();
                 if(txt.contains('other guest')) {

                     // wrap the count
                     var parsed = txt.match(/^(\d+)\s+(.*)/);

                     if(parsed) {
                         j(this).html('<span class="facebookmetric_hideshow" style="display:none;">'+
                             parsed[1]+'</span> '+parsed[2]);
                     }
                 }
        });


        // timeline block report (Activity - July - People Who Like This - 116)
        tlreportcontentclass.find('.bigNumber').not('.fbtimelinecount').each(function() {
                 j(this).addClass('fbtimelinecount fbtimelineblockcount');
                 j(this).css('opacity',0);
        });


        // timeline visited reports such as 'Visited 2 Places'
        tlreportcontentclass.find('.aboveUnitContent').not('.fbtimelinecount').each(function() {

             j(this).addClass('fbtimelinecount');

             var txt = j(this).text();

             // 'Visited 2 Places'
             if(txt.contains('Visited')) { 

                 // wrap the count
                 var parsed = txt.match(/(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);

                 if(parsed) {
                     j(this).html(parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+
                         parsed[2]+'</span> '+parsed[3]);
                 }
             } 
             
             // '65 friends posted on Someone's timeline.'
             else if(txt.contains('posted')) {

                 var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);

                 if(parsed) {
                     j(this).html('<span class="facebookmetric_hideshow" style="display:none;">'+
                         parsed[1]+'</span> '+parsed[2]);
                 }

             }

             // '10 Recent Places'
             else if(txt.contains('Place')) {

                 var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);

                 if(parsed) {
                     j(this).html('<span class="facebookmetric_hideshow" style="display:none;">'+
                         parsed[1]+'</span> '+parsed[2]);
                 }

             }

            // 'Tagged in 2 photos'
            else if(txt.contains('Tagged')) {
                var link = j(this).find('a[rel="theater"]'); 
                wrapNumberInString(link);
            }

        });

    }

    // +1 parts of '+1 Respond to Friend Request' buttons -- pretty sure this is only on timeline-type views
    j('.FriendRequestIncoming i, .FriendRequestOutgoing i').hide();


    // Places timeline report counts, hides the places count in the overlay sentence, such as:
    // 'Ben Grosser was at Somewhere and 2 other places.'  Handles singular/plural
    j('.fbTimelineAggregatedMapUnitCallout div.fcg').not('.fbtimelinecount').each(function() {
            j(this).addClass('fbtimelinecount');
            //var txt = j(this).text();
            var txt = j(this).html();

            if(txt.contains('place') && txt.match(/\d/)) {

                // wrap the place visit number
                var parsed = txt.match(/(.*)\s+(\d)\s(other place.*)/);

                if(parsed) {
                    j(this).html(parsed[1]+'<span class="facebookmetric_hideshow" style="display:none;"> '+
                        parsed[2]+'</span> '+parsed[3]); 
                }
            }
    });


    // timeline block subtitles sometimes contain metrics (such as the Friends block)
    // should probably target this more directly
    j('.date.fwn.fcg').each(function() { 
        var s = j(this).text(); 
        if(s.match(/\d/) && (s.match(/Friends/) || s.match(/Likes/) || s.match(/Photos/) || s.match(/Places/)) ) {
            //j(this).parent().html(
            j(this).removeClass('date fwn fcg').addClass('facebookmetric_fade').css('display','none').text(s);
        }
    });


    // timeline report blocks report friends in other ways as well, such as with mutual friends, places visited, etc.
    j('.timelineReportCol').find('div.date.fwn.fcg a').not('.mutualfriendcount').each(function() {
        j(this).addClass('mutualfriendcount');
        var txt = j(this).text();
        if(txt.contains('Mutual')) {
            var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html('<span class="facebookmetric_fade" style="display:none;">'+
                    parsed[1]+'</span> '+parsed[2]);
            }
        }
    });


    // timeline like blocks (e.g. 1 Friend Likes Kellie Dog Jpg)
    j('.headerDigit span').not('fbtimelineblockcounts').each(function() {
        j(this).addClass('fbtimelineblockcounts facebookmetric_hideshow');
        j(this).hide();
    });


    // inside timeline like blocks, friend counts about others who like/listen/etc. the thing (7 friends like this)
    j('.fbPageFriendSummarySection a[rel="dialog"]').not('.fbtimelineblocklikecount').each(function() {
        j(this).addClass('fbtimelineblocklikecount');
        var txt = j(this).text();
        if(txt) {
            var parsed = txt.match(/(\d+(?:,\d+)*)\s(.*)/);
            if(parsed) {
                j(this).html(
                    '<span class="facebookmetric_hideshow" style="display:none;">'+parsed[1]+' </span>'+
                    parsed[2]
                );
            }
        }
    });
        

    // Page post metrics, such as '19 people saw this post' .. only viewable to group admins (?)
    j('.insightsBar a').not('.fbtimelineinsight').each(function() {
        j(this).addClass('fbtimelineinsight');
        wrapNumberInString(this);
    });


    // timeline activity block new friends counts ('Dan is friends with John Doe and 6 other people')
    j('.storyText a[rel="dialog"]').not('.fbtimelineblockcounts').each(function() {
        j(this).addClass('fbtimelineblockcounts');
        wrapNumberInString(this);
    });


    // timeline activity block new friends counts (new version)
    j('.timelineRecentActivityTextBlock a[data-hover="tooltip"]').not('fbtimelineblockcounts').each(function() {
        j(this).addClass('fbtimelineblockcounts');
        wrapNumberInString(this);
    });



    // like lists on timeline blocks ('18 friends also like this')
    //j('#liked_pages_timeline_unit_list .uiListItem a[rel="dialog"]').not('fbtimelineblockcounts').each(function() {
    j('#liked_pages_timeline_unit_list li a[rel="dialog"]').not('.fbtimelineblockcounts').each(function() {
        j(this).addClass('fbtimelineblockcounts');
        wrapNumberInString(this);
    });


    // timeline entry feedback blocks: comment counts
    j('.fbTimelineFeedbackCommentLoader').not('.fbtimelineblockcounts').each(function() {

        j(this).addClass('fbtimelineblockcounts');

        tagAndStyleMetric(
            j(this),
            /^(<i><\/i>)(\d+(?:,\d+)*)/,
            'fbtimelineblockcount',
            2,
            'opacity:0;'
        );

    });
    

    // timeline entry share counts
    j('.fbTimelineFeedbackShares a').not('.fbtimelineblockcounts').each(function() {
        j(this).addClass('fbtimelineblockcounts');
        var html = j(this).html();
        if(html) {
            var parsed = html.match(/^(<i><\/i>)(\d+(?:,\d+)*)/);
            if(parsed) {
                j(this).html(parsed[1]+'<span class="fbtimelineblockcount" style="opacity:0;">'+
                    parsed[2]+'</span>');
            }
        }
    });

    
    // timeline subscribers counts (in the ribbon)
    j('#pagelet_timeline_subscribers_nav_top').find('table.statsContainer span.fwb').
        not('.fbribbonstat').each(function() {
            j(this).addClass('fbribbonstat').addClass('facebookmetric_fade').hide();
    });


    // timeline like counts (in the ribbon)
    j('#pagelet_timeline_likes_nav_top').find('table.statsContainer span.fwb').
        not('.fbribbonstat').each(function() {
            j(this).addClass('fbribbonstat').addClass('facebookmetric_fade').hide();
    });


    // business/org page timeline headline stats ('243 likes . 10 talking about this . 711 were here')
    // could just remove numbers from this, but it leaves nothing of use so taking the easy way out
    // at least for now
    j('#fbTimelineHeadline h2').find('div.fsm.fwn.fcg').not('.fbheadlinestat').each(function() {
        j(this).addClass('fbheadlinestat');
        var txt = j(this).text();

        if(txt.contains('likes')) 
            j(this).addClass('fbribbonstat').addClass('fbTimelineHeadlineStats').css('opacity','0');
    });

    // new interest page metrics (e.g. pizza)
    j('#pagelet_vertex_header ._5l6').not('.facebookcount').each(function() {
        wrapNumberInString(this);
        wrapNumberInString(j(this).find('a'));

    });


    // timeline-type personal friends list count
    j('#pagelet_friends h3 span:first').not('.fbtimelinefcwrapper').each(function() {
        j(this).addClass('fbtimelinefcwrapper');
        j(this).html(
            '<span style="display:none;" class="facebookmetric_fade">'+j(this).html()+'</span>'
        );
    });


    demetricateFriendPageBlocks();


    // new friend page meta counts (friends, mutual, recent, high school, etc.)
    j('#friends_nav_pagelet div._qy').not('.fbfriendcount').
        addClass('fbfriendcount facebookmetric_opacity').css('opacity','0');


    // timeline-type mutual friends list counts, photo counts on albums pages, etc.
    j('.fbTimelineSection h3:first').not('.fbmutualfriends').
        addClass('fbmutualfriends').each(function() {
            var txt = j(this).html();
            // if this is an album, deal with the ' . Videos' trailer on the header
            if(txt.contains('Videos')) {
                // works for the photos page that also lists metrics for videos
                var parsed = txt.match(/(.*)(\(\d+(?:,\d+)*\))(.*)(\(\d+(?:,\d+)*\))(.*)/);
                if(parsed) {
                    j(this).html(
                        parsed[1]+' <span class="facebookmetric_fade" style="display:none;">'+
                        parsed[2]+'</span>'+
                        parsed[3]+' <span class="facebookmetric_fade" style="display:none;">'+
                        parsed[4]+
                        parsed[5]
                    );
                }

                // works for video list page (e.g. 'Your Videos (1) . Albums')
                else {
                    parsed = txt.match(/(.*)(\(\d+(?:,\d+)*\))(.*)/);
                    if(parsed) {
                        j(this).html(
                            parsed[1]+' <span class="facebookmetric_fade" style="display:none;">'+
                            parsed[2]+'</span>'+parsed[3]
                        );
                    }
                }




            }
            // else it's easier
            else if(txt) {
                var parsed = txt.match(/(.*)(\(\d+(?:,\d+)*\))/);
                if(parsed) {
                    j(this).html(
                        parsed[1]+' <span class="facebookmetric_fade" style="display:none;">'+
                        parsed[2]+'</span>'
                    );
                }
            }
            return false;
    });


    // timeline subscriptions page
    demetricateFollowListItem(j('.followListItem'));


    // subscribers header counts
    j('.followListFilter .lfloat span').not('.fbfollowitem').each(function() {
        j(this).addClass('fbfollowitem');
        wrapNumberInString(this);
    });

    
    // timeline add friend +1 icons
    j('#pagelet_friends span.FriendLink i').hide();
    j('#pagelet_friends span.FriendLink a').css('padding-left','0px');


    // timeline unit headlines, such as Soandso suchandsuch (55 photos)
    j('.aboveUnitContent span.fcg').not('.fbtimelinephotocount').each(function() {
        j(this).addClass('fbtimelinephotocount');
        var txt = j(this).text();
        if(txt) {
            var parsed = txt.match(/^(\()(\d+(?:,\d+)*)(.*)(\))/);
            if(parsed) {
                j(this).html(parsed[1]+'<span class="facebookmetric_hideshow" style="display:none;">'+parsed[2]+
                    ' </span>'+parsed[3].replace(/\s/,'')+parsed[4]);
            }
        }

        // yet another way of listing photo counts in timeline boxes
        var nextitem = j(this).find('a[data-hover="tooltip"]');

        if(nextitem) {
            var nexttxt = nextitem.text();
            if(nexttxt.contains('other')) {
                var nextparsed = nexttxt.match(/(\d+(?:,\d+)*)(.*)/);
                if(nextparsed) {
                    nextitem.html('<span class="facebookmetric_hideshow" style="display:none;">'+
                        nextparsed[1]+' </span>'+nextparsed[2]);
                }
            }
        }

    });


    // timeline block image overlay counts, such as in the albums timeline report, where
    // it gives the album name plus a metric (e.g. 'Profile Pictures (12)').  this selector
    // will return plenty of items that don't have metrics, but only acts on those that do
    // (and i'm hoping to catch new ones they add with the same pattern by going broad)
    j('div.mas.name').not('.facebookmetric').each(function() {
        j(this).addClass('facebookmetric');
        var html = j(this).html();
        if(html) {
            var parsed = html.match(/^(.*)\s+(\(\d+(?:,\d+)*\))/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+
                    parsed[2]+'</span>');
            }
        }
    }); 

    
    // timeline block headers sometimes lead with a metric, such as
    // '41 friends posted on Someone's timeline for her birthday'
    j('.timelineUnitContainer h5').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });
    
    
    // timeline block headers also sometimes have embedded links that contains
    // leading metrics, such as 'Ben Grosser added 4 photos to the album mobile uploads.'
    j('.timelineUnitContainer h5 a').next().not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });


    // timeline favorites reports friend counts
    j('.pageBox a[rel="dialog"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

     
    // stylized +N icons that fit within a group of friend tinyman photos
    // such as '+3' to indicate there are more friends than can fit in the
    // timeline box we're looking at.  
    j('.fbTimelineBoxCount').not('.boxcount').each(function() {
        j(this).addClass('boxcount');
        var txt = j(this).text();
        j(this).html('<span class="facebookmetric_hideshow" style="display:none;">'+txt+'</span>');
    });




    // timeline birthday report counts
    j('.fbTimelineUnitActor.aboveUnitContent h5.unitHeader').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });


    // -------------------------------
    // ------- TIMELINE RIBBON -------
    // -------------------------------
    
    // the small drop-down on the right-hand side of the timeline ribbon that expands 
    // the icons to show the rest of the items (e.g. friends, likes, photos, etc.).  this one
    // can't just be hidden due to the way FB rewrites the button code after the click, so I 
    // instead animate it's color to white for hiding (and back to original color for showing)
    j('.fbTimelineMoreButton').find('.fbTimelineRibbon').find('.text').animate({color:"#fff"}, FADE_SPEED);

    // timeline mutual friends count (on timeline profiles other than your own)
    j('#pagelet_timeline_friends_nav_top').find('.fbTimelineRibbon').find('.text').
        not('.fbribboncounts').each(function() {
            j(this).addClass('fbribboncounts');
            var txt = j(this).text();

            if(txt.contains('Mutual')) {

                // wrap the mutual number
                var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);

                if(parsed) {
                    j(this).html('<span class="facebookmetric_hideshow" style="display:none;">'+
                        parsed[1]+'</span> '+parsed[2]);
                }
            }

    });

    // year in review
    j('._16v7').find('div.fsm.fwn.fcg').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).text();
        var parsed = txt.match(/(.*)\s+(20)\s+(.*)/);
        if(parsed) {
            j(this).html(
                parsed[1]+
                '<span style="display:none;" class="facebookmetric_hideshow"> '+parsed[2]+'</span> '+
                parsed[3]
                );
        }
    });





    // END TIMELINE GENERAL



    // FRIENDS PAGE
    // vanished
    j('.-cx-PRIVATE-friendsTabNav__count').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount facebookmetric_opacity').css('opacity','0');
    });


    // PHOTOS
    demetricatePhotoIndex();

    // tag count on photo tag overlays
    j('.tagPhotoLink a.uiLinkLightBlue').not('.facebookcount').
        addClass('facebookcount facebookmetric_hideshow').hide();

    // album page individual albums photo counts (facebook.com/username/photos)
    j('.photoText .fsm.fwn.fcg').not('.facebookcount').addClass('facebookcount').css('opacity','0');
    
    /*
    j('.photoText .fsm.fwn.fcg').not('.facebookcount').each(function() {
        wrapNumberInString(j(this));
    });
    */
    
    /*
    j('.photoText .fsm.fwn.fcg').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).html();
        var astore = j(this).find('a');
        console.log("txt: "+txt);
        console.log("a: "+astore);
    });
    */


    // -------------------------------------------------------------
    // -- TIMELINE-TYPE VIEWS THAT AREN'T TIMELINES OR NEWS FEEDS --
    // -------------------------------------------------------------

    // other friends counts on favorites page like items
    j('.fbStreamTimelineFavFriendContainer a[rel="dialog"]').not('.fbfavinfo').each(function() {
        j(this).addClass('fbfavinfo');
        var txt = j(this).text();
        var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
        if(parsed) {
            j(this).html(
                '<span style="display:none;" class="facebookmetric_hideshow">'+parsed[1]+'</span> '+parsed[2]);
        }
    });


    // big numbers on timeline likes pages (for businesses, etc)
    j('.timelineLikesBigNumber').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount facebookmetric_opacity').css('opacity','0');
    });

    // mutual friends counts on likes for the favorites page (timeline-type)
    j('.fbStreamTimelineFavInfoContainer').not('.fbfavinfo').each(function() { 

        // returns only the text element of a container that also has other wrapped elements
        // used by the demetrication routine for /name/favorites to remove people like this counts
        j.fn.justtext = function() { return j(this).clone().children().remove().end().text(); };

        j(this).addClass('fbfavinfo');
        var children = j(this).children();
        var txt = j(this).justtext();
        var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
        if(parsed) {
            var newtxt = 
                '<span style="display:none;" class="facebookmetric_hideshow">'+
                    parsed[1]+'</span> '+parsed[2]+'<br/>';
            j(this).html(children).find('div:last').prepend(newtxt);
        }
    });

    // MAP page
    j('.fbTimelineMapFilterTagCount').not('.facebookcount').
        addClass('facebookcount facebookmetric_opacity').css('opacity','0');



    // they take a second to come up
    setTimeout(function() { demetricateMapBubbles(); }, 200 );
    setTimeout(function() { demetricateMapBubbles(); }, 600 );

    // follower counts on timeline headers
    j('._wj').not('.facebookcount').addClass('facebookcount facebookmetric_opacity').css('opacity','0');

    
    //bling boxes are now showing up on new interest pages in a 'timeline' style
    
   //     j('.UFIBlingBoxText').not('.facebookmetric_fade').addClass('facebookmetric_fade').css('display','none');

} // end demetricateTimeline()

function demetricateChatTab() {
    /*
    j('.fbMercuryChatTab span.numMessages').not('.facebookmetric').each(function() {
        j(this).addClass('facebookmetric facebookmetric_opacity');
        j(this).css('opacity','0');
    });
    */

    j('#BuddylistPagelet .fbNubButton').not('.demetricatedchat').each(function() {
        j(this).addClass('demetricatedchat');
        j(this).append('<span class="fbdchatlabel" style="line-height:15px;">Chat</span>');
        j(this).find('span.label').hide();
    });

    // individual chat tab metric indicators (gets rid of red/white balloon
    // metric, but retains blue 'active' color
    j('.-cx-PRIVATE-fbMercuryChatTab__nummessages').not('.facebookcount').
        each(function() {
            j(this).addClass('facebookcount facebookmetric_hideshow');
            j(this).css('display','none');
        }
      );


    // new new chattab metric
    j('#ChatTabsPagelet .fbChatTab ._51jx').not('.facebookcount').
        each(function() {
            j(this).addClass('facebookcount facebookmetric_hideshow');
            j(this).css('display','none');
        }
      );
}


// 2012 year in review page
function demetricateYearInReview() {
    // year in review popup box
    j('._krz').find('span.fsl.fcg').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).html();
        var parsed = txt.match(/(.*)\s+(20)\s+(.*)/);
        if(parsed) {
            j(this).html(
                parsed[1]+
                '<span style="display:none;" class="facebookmetric_hideshow"> '+parsed[2]+'</span> '+
                parsed[3]
                );
        }
    });

    // year in review pages and friends like counts
    j('div._wj._lc-').not('.facebookmetric_opacity').addClass('facebookmetric_opacity').css('opacity','0');

    j('.fbFacepileItemMoreText').not('.facebookmetric_opacity').addClass('facebookmetric_opacity').
        css('opacity','0');
}

// MUSIC page
function demetricateMusic() {
    if(FUNCTION_REPORT) console.log("demetricateMusic()");

    // I'm not going to catch everything here, as each new music service has its own new
    // way of showing metrics and i dont' want to keep up, but i will manage typical FB
    // presentations of metrics here (such as song list pager links)
    j('.songListPager').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).html();
        if(txt) {
            var parsed = txt.match(/^(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_fade" style="display:none;">'+
                    parsed[2]+'</span> '+
                    parsed[3]
                );
            }
        }
    });


    // music service pitch boxes for spotify and earbits
    j('#music_services li').find('span.fcg').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).text();
        if(txt.contains('Earbits')) wrapNumberInString(this);
        else if(txt.contains('Spotify')) {
            var parsed = txt.match(/^(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_fade" style="display:none;">'+
                    parsed[2]+'</span> '+
                    parsed[3]
                );
            }
        }
    });
}


// NEW FRIENDS PAGE
function demetricateFriendPageBlocks() {

    // new friend page mutual friend counts
    j('#pagelet_friends a.uiLinkSubtle').not('.fbmutualfriends').each(function() {
        j(this).addClass('fbmutualfriends');
        var txt = j(this).text();
        if(txt.contains('mutual friend')) wrapNumberInString(this);
    });
}

// APP CENTER
function demetricateAppCenter() {
    if(FUNCTION_REPORT) console.log("demetricateAppCenter()");

            // APP CENTER pages

    // app block user counts. erasing the number doesn't leave anything of use, unless there's also some personal friend
    // counts.  for the moment, remove the line, but should come back and be more selective
    j('.appsListItem .appCategories div.fcg').not('.facebookcount').
        addClass('facebookcount facebookmetric_opacity').css('opacity',0);

    // side navigation counts
    j('.sideNavItem .count').not('.facebookcount').addClass('facebookcount facebookmetric_fade').hide();
}


// EVENTS / CALENDAR
function demetricateEvents() {
    if(FUNCTION_REPORT) console.log("demetricateEvents()");

        // EVENTS page

    // red/white number in the 'invites' button on the Calendar tab
    //j('.counter').not('.facebookcount').addClass('facebookcount facebookmetric_fade').hide();
    j('.counter').hide();


    // parenthetic invite count on list
    j('.fbCalendarBoxHeader').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).html();
        if(txt) {
            var parsed = txt.match(/(.*)(\(\d+(?:,\d+)*\))/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_fade" style="display:none;">'+
                    parsed[2]+'</span>'
                );
            }
        }
        return false;
    });

    // event blocks on list ('2 friends invited you')
    j('fbCalendarInviteContent a[rel="dialog"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // event block guest counts (e.g. 'Soandso and 2 other friends are guests')
    j('.fbCalendarItemContent div.fsm.fwn.fcg a[rel="dialog"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // group page event block guest lists (e.g. 'soandso and 12 other guests')
    j('#pagelet_group_events div.fsm.fwn.fcg a[rel="dialog"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // new new related events going counts
    j('#event_related_events div._5x5k').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // Going, Maybe, Invited on Event detail page
    j('#pagelet_event_guests_going a[rel="dialog"], #pagelet_event_guests_maybe [rel="dialog"], #pagelet_event_guests_invited [rel="dialog"]').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).html();
        if(txt) {
            var parsed = txt.match(/(.*)(\(\d+(?:,\d+)*\))/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_fade" style="display:none;">'+
                    parsed[2]+'</span>'
                );
            }
        }
    });


    // new new guest metrics
    j('._3eni').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount facebookmetric_opacity').css('opacity','0');
    });



}

function demetricateCounters() {
    if(FUNCTION_REPORT) console.log("demetricateCounters()");

        // --------------------------------------------------------
    // -- SIDEBAR COUNTS (TIMELINE, OLD-STYLE PROFILE, ETC.) --
    // --------------------------------------------------------
    //
    // a few facebook metrics are already marked by Facebook with .count. 
    // wrap some items and tag them all
    //
    
    // some are marked already with .counter -- easy
        j('.counter').fadeOut(FADE_SPEED);


        // testing this out...hides values on left-hand bar but leaves outlines as
        // newness indicator
        j('.countValue').not('.facebookcount').
            addClass('facebookcount facebookmetric_opacity').
            css('opacity','0').
            parent().addClass('facebookcount');

        j('.maxCountIndicator').not('.facebookcount').
            addClass('facebookcount facebookmetric_hideshow').
            hide();

    var countclass = j('.count');

    if(countclass.length) {
        countclass.not('.facebookcount').each(function() {

            j(this).addClass('facebookcount');

            // uiSideNavCount is for newsfeed left sidebar counts (events, groups, etc)
            // uiSideNavCountText is for old-style profile counts, such as Photos, Friends, etc.)
            // both are easy, so just mark them
            if(j(this).hasClass('uiSideNavCount') || j(this).hasClass('uiSideNavCountText')) {
                j(this).addClass('facebookmetric_fade').css('display','none');
            } 
            
            // otherwise the count needs to be wrapped for trouble-free jQuery fading
            else {
                if(j(this).parent().hasClass('label')) return;
                var n = j(this).text();;
                j(this).html('<div style="display:none;" class="facebookmetric_fade">'+n+'</div>');
            }

        });
    }
}

function demetricateNotifications() {
    // -----------------------------------------------------------------------
    // -- NAVBAR RED/WHITE NOTIFICATION ICONS, NOTIFICATION DROP-DOWN MENUS --
    // -----------------------------------------------------------------------
    // 
    // these catch the red/white notification icons in the top menu.  they each get their own
    // class so I can individually query them later to make sure they're not 0 before revealing them
    j('#fbRequestsJewel').find('.jewelCount').not('.facebookmetricreqp').addClass('facebookmetricreqp').hide();
    j('#fbMessagesJewel').find('.jewelCount').not('.facebookmetricmsgp').addClass('facebookmetricmsgp').hide();
    j('#fbNotificationsJewel').find('.jewelCount').not('.facebookmetricnotp').addClass('facebookmetricnotp').hide();
    
    j('#requestsCountValue').not('.facebookmetricnot').addClass('facebookmetricnot').hide();
    j('#mercurymessagesCountValue').not('.facebookmetricnot').addClass('facebookmetricnot').hide();
    j('#notificationsCountValue').not('.facebookmetricnot').addClass('facebookmetricnot').hide();

    // small link counts, such as '10 mutual friends' in the friend requests drop-down
    j('#fbRequestsList a.uiLinkSubtle').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // new Home navbar metrics (obnoxious)
    demetricateHomeCount(); 


    // new new notification count popup (4 notifications from x, y, z, etc)
    j('._53ii ._5bov ._42ef._8u span:first').not('.facebookcount').addClass('facebookcount').each(function() {
        wrapNumberInString(this);
    });
}

function demetricateHomeCount() {
    // new Home navbar metrics (obnoxious)
    j('._5ah-, .-cx-PRIVATE-litestandHomeBadge__wrapper').
        not('.facebookcount').each(function() {
        j(this).addClass('facebookcount facebook_homecount facebookmetric_hideshow').hide();
    });
}

// PAGERS
function demetricatePagers() {

    // 'See More (3)' pager controls, occur in multiple views (news feed, photo albums, etc.)
    
    // NEW pager controls dec 2012
    j('._4e1').not('.fbtimelinecount').each(function() {
        j(this).addClass('fbtimelinecount');
        var html = j(this).html();
        var parsed = html.match(/(.*See)\s+(\d+(?:,\d+)*)\s+(.*)/);
        if(parsed) {
            j(this).html(
                parsed[1]+
                '<span style="display:none;" class="facebookmetric_hideshow"> '+parsed[2]+'</span> '+
                parsed[3]
            );
        }

    });

    return;

    j('a.uiMorePagerPrimary').not('.fbtimelinecount').each(function() {
            j(this).addClass('fbtimelinecount');
            var txt = j(this).text();
            //var txt = j(this).html();

            if(txt.match(/^\d/) && txt.contains('more')) {

                // wrap the place visit number
                var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);

                if(parsed) {
                    j(this).html('<span class="facebookmetric_hideshow" style="display:none;"> '+
                        parsed[1]+'</span> '+parsed[2]); 
                }
            }

            else if(txt.contains('See More')) {
                // wrap the place visit number
                var parsed2 = txt.match(/^(See More)\s+(\(\d+(?:,\d+)*\))/);

                if(parsed2) {
                    j(this).html(parsed2[1]+' <span class="facebookmetric_hideshow" style="display:none;"> '+
                        parsed2[2]+'</span>'); 
                }
            }
    });
}


// GROUP pages
function demetricateGroups() {
    if(FUNCTION_REPORT) console.log("demetricateGroups()");

        // ----------------------------------
    // ------- GROUP PAGE METRICS -------
    // ----------------------------------
   
    // group member counts (when you aren't a member)
    j('.groupsJumpInfoArea div.fsm.fwn.fcg').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    
    // group filter/search button
    j('.groupMemberActionBar .uiSelectorButton span.uiButtonText').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).text();
        var parsed = txt.match(/^(.*)\s+(\(\d+(?:,\d+)*\))/);
        if(parsed) { 
            j(this).html(
                parsed[1]+
                '<span class="facebookmetric_hideshow" style="display:none;"> '+parsed[2]+'</span>'
            );
        }
    });


    j('.groupMemberActionBar .uiSelectorMenuWrapper span.itemLabel').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).text();
        var parsed = txt.match(/^(.*)\s+(\(\d+(?:,\d+)*\))/);
        if(parsed) { 
            j(this).html(
                parsed[1]+
                '<span class="facebookmetric_hideshow" style="display:none;"> '+parsed[2]+'</span>'
            );
        }
    });


    // group feed member counts ('someone and 11 other people are in this group')
    j('#pagelet_group_pager .groupsStreamMemberBoxNames a[data-hover="tooltip"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    j('.uiStreamShowAll a').find('span').not('.facebookcount').each(function() {
            j(this).addClass('facebookcount');
            var txt = j(this).text();
            if(txt) {
                var parsed = txt.match(/^(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    j(this).html(
                        parsed[1]+ '<span class="facebookmetric_hideshow" style="display:none;"> '+
                        parsed[2]+ '</span> '+
                        parsed[3]
                    );
                }
            }

    });

    // _4--q new new newsfeed update
    j('a._4--q').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    var fbgroupsidebox = j('.groupsAddMemberSideBox');

        // group member counts top-right ('9 members')
        // _4--q new new newsfeed update
        fbgroupsidebox.find('a.uiLinkSubtle').not('.facebookcount').each(function() {
            wrapNumberInString(this);
        });

        // alternate way under jun 2013 update
        fbgroupsidebox.find('#count_text').not('.facebookcount').each(function() {
            wrapNumberInString(this);
        });

        // group new member counts '(1 new)'
        fbgroupsidebox.find('a.mls').find('span.fwb').not('.facebookcount').each(function() {
            j(this).addClass('facebookcount');
            var txt = j(this).text();
            if(txt) {
                var parsed = txt.match(/^(\()(\d+(?:,\d+)*)\s+(.*\))/);
                if(parsed) {
                    j(this).html(parsed[1]+
                        '<span class="facebookmetric_hideshow" style="display:none;">'+
                        parsed[2]+
                        ' </span>'+parsed[3]
                    );
                }
            }
        });


    // 'Seen by 3' on group posts
    j('.UFISeenCountIcon').next().not('.seenby').each(function() {
        j(this).addClass('seenby');
        var txt = j(this).text();
        if(txt) {
            //var parsed = txt.match(/^(.*i>)(Seen by)\s+(\d+(?:,\d+)*)/);
            var parsed = txt.match(/^(Seen by)\s+(\d+(?:,\d+)*)/);
            if(parsed) {
                var newhtml = 
                    '<span class="facebookmetric_toggleOFF" style="display:none;">'+parsed[0]+'</span>'+
                    //'<span class="facebookmetric_toggleON">'+parsed[1]+' people</span>';
                    '<span class="facebookmetric_toggleON">Seen</span>';
                j(this).html(newhtml);
            }
        }
    });


}


function demetricateMessages() {
    
    if(FUNCTION_REPORT) console.log("demetricateMessages()");

    demetricateMessageMutualFriends();
    setTimeout(demetricateMessageMutualFriends, 8000);

    // gets the categories (Inbox, Other, etc).  need to do more here
    // but this will do for now
    demetricateMessageCategoryMetrics();

    // catches timestamps in originally-chosen category, but not new selections
    // quick fix until I work on new message interface
    demetricateTimestamps();
    setTimeout(demetricateTimestamps, 1000);

    // MESSAGES
    /*
    if(curURL.contains('messages')) {
        demetricateMessageMutualFriends();
        setTimeout(demetricateMessageMutualFriends, 1000);
        setTimeout(demetricateMessageMutualFriends, 2000);
        setTimeout(demetricateMessageMutualFriends, 4000);

    j('.unreadCount').not('.facebookcount').addClass('facebookcount facebookmetric_hideshow').hide();
    }
    */
   
    

}

function demetricateMessageCategoryMetrics() {
    // new messages interface, category counts (inbox, other, etc)
    j('.wmMasterView span.fwn').not('.facebookmetric_hideshow').addClass('facebookmetric_opacity').css('opacity','0');
    j('._1r').not('.facebookmetric_hideshow').addClass('facebookmetric_opacity').css('opacity','0');
}

// list of people one subscribes to (timeline)
// includes subscriber counts (e.g. 82387 subscribers) and other friends who subscribe
// counts (e.g. Soandso and 3 other friends are subscribed)
// also works for /subscriptions/suggestions/
function demetricateFollowListItem(jnode) {
        var txt;
        var parsed;

        // subscriber counts
        jnode.find('.inlineBlock').not('.fbfollowitem').each(function() { 
            j(this).addClass('fbfollowitem');
            txt = j(this).html();

            if(txt.contains('subscriber') || txt.contains('followers')) {
                parsed = txt.match(/(.*·)\s+(\d+(?:,\d+)*)(.*)/);
                if(parsed) {
                    j(this).html(
                        parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+
                        parsed[2]+'</span>'+
                        parsed[3]
                    );
                }
            } 
        });

        // other friends who subscribe counts
        jnode.find('a[rel="dialog"]').not('.fbfollowitem').each(function() {
            j(this).addClass('fbfollowitem');
            wrapNumberInString(this);
        });

}


//
function demetricateFriendBrowserBlocks() {
    if(!demetricatorON) return;

    // friend list +1 icons in the 'add friend' buttons
    j('.FriendRequestAdd').find('i').not('.facebookmetric_hideshow').addClass('facebookmetric_hideshow').hide();

    // /find-friends page mutual friends counts, such as 'Jo Blow and 10 mutual friends' 
    j('.friendBrowserMarginTopTiny a[rel="dialog"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // catches mutual friend blocks on search result pages
    j('a.uiLinkSubtle[rel="dialog"]').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

}


// search results, dynamic autocomplete entry metrics (mutual friends, people like this, etc.)
function demetricateSearchResultEntries(jnode) {
    if(!demetricatorON) return;

    if(demetricatorON) {
        j('ul.search li.page, ul.search li.place, ul.search li.tophit, ul.search li.ownsection').
            find('.subtext').not('.fbsearchentry').each(function() { 
            j(this).addClass('fbsearchentry');
            j(this).text('people like this · people talk about this'); 
        });

        j('ul.search li.user').find('.subtext').not('.fbsearchentry').each(function() { 
            j(this).addClass('fbsearchentry');
            j(this).text('mutual friends'); 
        });

        j('ul.search li.calltoaction').find('.subtext').not('.fbsearchentry').each(function() { 
            j(this).addClass('fbsearchentry');
            j(this).text('Displaying top results'); 
        });

        j('ul.search li.app').find('.subtext').not('.fbsearchentry').each(function() { 
            j(this).addClass('fbsearchentry');
            j(this).text('monthly users'); 
        });

        j('ul.search li.group').find('.subtext').not('.fbsearchentry').each(function() { 
            j(this).addClass('fbsearchentry');
            j(this).text('members'); 
        });
    }
}


// all 'XX likes this' links under newsfeed items
function demetricateLikesThis(jnode) {

    if(!demetricatorON) return;

    if(FUNCTION_REPORT) console.log("demetricateLikesThis()");

    if(!jnode) { 
        //var jnode = j('.UFILikeSentence a > span'); 
        // FB update 2/20/2012
        var jnode = j('.UFILikeSentence span a[rel="dialog"]');
    }

    // timeline entry feedback blocks: like counts
    //j('.fbTimelineFeedbackCommentLoader').not('.fbtimelineblockcounts').each(function() {


    // EXPERIMENT
    
    
    //if(j('body.timelineLayout').length) {
   
        j('.fbTimelineFeedbackLikes a').not('.fbtimelineblockcounts').each(function() {
            j(this).addClass('fbtimelineblockcounts');
            var html = j(this).html();
            if(html) {
                var parsed = html.match(/^(<i><\/i>)(\d+(?:,\d+)*)/);
                if(parsed) {
                    j(this).html(parsed[1]+'<span class="fbtimelineblockcount" style="opacity:0;">'+
                        parsed[2]+'</span>');
                }
            }
        });

    //}

    j('.fbTimelineFeedbackComments a').not('.fbtimelineblockcounts').each(function() {
        j(this).addClass('fbtimelineblockcounts');
        var html = j(this).html();
        if(html) {
            var parsed = html.match(/^(<i><\/i>)(\d+(?:,\d+)*)/);
            if(parsed) {
                j(this).html(parsed[1]+'<span class="fbtimelineblockcount" style="opacity:0;">'+
                    parsed[2]+'</span>');
            }
        }
    });

    /*
    j('.ufiItem a[title="See who likes this"]').not('.fblikesthis').each(function() { 
        var ref = j(this).attr('href');
        var ajx = j(this).attr('ajaxify');
        var newlink = '<a href="'+ref+'" ajaxify="'+ajx+'" class="fblikesthis facebookmetric_toggleON" '+
            'rel="dialog" title="See who likes this">people</a>';

        j(this).before(newlink);
        j(this).addClass('fblikesthis facebookmetric_toggleOFF').css('display','none');
    });
    */

    //j('.UFILikeSentence a span').not('.facebooklikecount').each(function() {
    //    j(this).addClass('facebooklikecount');
    
    //jnode.has('span.facebookmetric_hideshow').each(function() {
    //

    //jnode.find(':not(span.facebookmetric_hideshow)').removeClass('facebookcount');

    

    /*
    jnode.find('a span').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });
    */

    /*
    j('.UFILikeSentence span a[rel="dialog"] span').first().not('.facebookcount').addClass('likeparent').each(function() {
        j(this).addClass('demetricatedlike');
        wrapNumberInString(this);
    });
    */

    //jnode.not('.facebookcount').each(function() {
    /*
    j('.UFILikeSentence').find('span a[rel="dialog"]').not('.facebookcount').addClass('facebookcount likeparent').each(function() {
        var txt = j(this).html();
        var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
        if(parsed) {
            j(this).html(
                '<span style="display:none;" class="facebookmetric_hideshow demetricatedlike">'+parsed[1]+'</span> '+parsed[2]);
        }
        //j(this).addClass('facebookcount likeparent');
    });
    */

    /*
    if(jnode.find('span.facebookmetric_hideshow')) return;
    else wrapNumberInString(jnode);
    */

        //j('.UFILikeSentence a span').not('.facebookcount').each(function() {
    jnode.not('.facebookcount').each(function() {
        wrapNumberInString(this);
        j(this).addClass('demetricatedlike');
    });
        

}

function redemetricateLike(jnode) {
    console.log('rdl: '+jnode.text());
    console.log('rdl-p: '+jnode.parent().text());
}

function demetricatePhotoIndex() {
    if(FUNCTION_REPORT) console.log("demetricatePhotoIndex()");

            // PHOTOS page
        //j('.fbPhotosRedesignNavCount,.fbPhotosRedesignLikes,.fbPhotosRedesignComments').
        j('.fbPhotosRedesignNavCount').
            not('.facebookmetric_opacity').
            addClass('facebookmetric_opacity').
            css('opacity','0');

        // old naming for photo bling box counts --- some logical naming and easy for once
        j('.fbPhotosRedesignLikes,.fbPhotosRedesignComments').not('.facebookcount').each(function() {
            j(this).html('<span style="opacity:0" class="facebookmetric_opacity">'+
                j(this).text() + '</span>');
        });

        // but only lasted a week until it became a complete clusterfuck of obfuscation ...
        // i don't think this will last, so I'm leaving above in just in case
        j('._53n,._53m').not('.facebookcount').each(function() {
            j(this).html('<span style="opacity:0" class="facebookmetric_opacity">'+
                j(this).text() + '</span>');
        });

        // new timeline update 5/2013
        j('.-cx-PRIVATE-fbInlineActions__likes, .-cx-PRIVATE-fbInlineActions__comments').
            not('.facebookcount').each(function() {
            j(this).html('<span style="opacity:0" class="facebookmetric_opacity">'+
                j(this).text() + '</span>');
        });

}


// the chat list has a built-in separator between two lists of possible chatters
// the separator contains a metric like 'MORE ONLINE FRIENDS (8)'.  this separator
// is dynamically altered regularly (10 seconds maybe?).  i store the current
// chat count (for later demetrication)
function demetricateChatSeparator() {
    if(demetricatorON) {
        if(FUNCTION_REPORT) console.log("demetricateChatSeparator()");

        //var chatsep = j('.moreOnlineFriends span.text').not('.fbchatsep');
        var chatsep = j('._554p, .-cx-PRIVATE-fbChatOrderedList__separatortext').not('.fbchatsep');

        if(chatsep) {
            chatsep.addClass('fbchatsep');
            var txt = chatsep.text();
            var parsed = txt.match(/^(.*)\s+(\(\d+(?:,\d+)*\))/);

            if(parsed) {
                chatsep.html(
                    parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+parsed[2]+'</span>'
                );
            }

        }
    }
}

// 'View all 4 comments'
function demetricateViewAllComments(jnode) {

    if(demetricatorON) {

        if(FUNCTION_REPORT) console.log("demetricateViewAllComments()");

    if(!jnode) {
        //jnode = j('.UFIPagerLink span > span');
        // FB update 2/20/2012
        jnode = j('.UFIPagerLink span');
    }

        jnode.not('.facebookmetric').each(function() { 
            j(this).addClass('facebookmetric');

            var txt = j(this).text();
            var parsed = txt.match(/(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1] + '<span class="facebookmetric_hideshow facebookmetric" style="display:none"> '+
                    parsed[2] + '</span> ' +
                    parsed[3]
                    );

                j(this).addClass('demetricatedviewall');
            } 

        });

        // new '6 Replies' metrics, jun 2013
        j('.UFIReplyList span').not('.facebookmetric').each(function() {
            j(this).addClass('facebookmetric');
            var txt = j(this).text();
            if(txt) {
                if(txt.contains("Replies") || txt.contains("Reply")) {
                    wrapNumberInString(this);
                }
            }
        });


    }

}


// cleans up search result block items
function demetricateSearchResult(sr) {
    // SEARCH RESULTS page
    //var sr = j('.detailedsearch_result');
    
    demetricateAddFriendButtons(sr);

    sr.find('.pls div.fsm.fwn.fcg div.fsm.fwn.fcg').not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        var txt = j(this).text();
        if(txt) {
            var parsed = txt.match(/^(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1]+' <span class="facebookmetric_hideshow" style="display:none;">'+
                    parsed[2]+'</span> '+
                    parsed[3]
                );
            } else {
                parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    j(this).html(
                        '<span style="display:none;" class="facebookmetric_hideshow">'+parsed[1]+'</span> '+parsed[2]
                    );
                }
            }

        }
    });

    //sr.find('.detailedsearch_actions a:first').not('.facebookcount').each(function() {
    sr.find('.detailedsearch_actions a').not('.facebookcount').each(function() {
        var txt = j(this).text();
        if(txt.contains('mutual') || txt.contains('other')) wrapNumberInString(this);
        else j(this).addClass('facebookcount');
    });

}

// trying to get the 'Seen by' viewer timings demetricated but not having luck yet
// this should do the trick but doesn't catch it for some reason.  will leave for later
function demetricateAriaAlert() {
    var a = j('#ariaPoliteAlert');
    var txt = a.text()
    var alines = txt.match(/[^\r\n]+/g);
    var newhtml = '';

    j.each(alines, function(index,value) { 
        var parsed = this.match(/^(.*·)\s+(\d+:\d+.*)/); 
        if(parsed) {
            if(demetricatorON) {
                newhtml += '<span class="facebookmetric_toggleOFF" style="display:none;">'+parsed[0]+'</span>';
                newhtml += '<span class="facebookmetric_toggleON">'+parsed[1]+' recently</span>';
            } else {
                newhtml += '<span class="facebookmetric_toggleOFF">'+parsed[0]+'</span>';
                newhtml += '<span class="facebookmetric_toggleON" style="display:none;">'+parsed[1]+' recently</span>';
            }
            a.html(newhtml);
        }
    });
}


// like buttons have counts and are dynamically generated
// called from a waitForElements()
function demetricateCommentLikeButton() {

    if(!demetricatorON) return;

    if(FUNCTION_REPORT) console.log("demetricateCommentLikeButton()");

    // comment like counts (next to the little thumbs up icon).  currently
    // polling on comment_like_button, may be to narrow (?)
    //j('.comment_like_button').not('.fbcommentlike').each(function() {
    j('.UFICommentLikeButton').not('.fbcommentlike').each(function() {
        var inner = j('<i>').addClass('cmt_like_icon');
        var newlink = j('<a>');

        newlink.attr('data-hover','tooltip').attr('data-tooltip-uri',
            j(this).attr('data-tooltip-uri'));
        //newlink.attr('title','people like this').attr('rel','dialog').attr('href',j(this).attr('href'));
        newlink.attr('rel','dialog').attr('href',j(this).attr('href'));
        newlink.attr('ajaxify',j(this).attr('ajaxify'));
        //newlink.addClass('comment_like_button fbcommentlike facebookmetric_toggleON');
        newlink.addClass('UFICommentLikeButton fbcommentlike facebookmetric_toggleON');
        newlink.html(inner);

        j(this).before(newlink);
        j(this).addClass('fbcommentlike facebookmetric_toggleOFF').css('display','none');
    });

    
    // COMMENTS - view previous comments pager metrics
    //`j('.rfloat span.fcg span').not('.fbcount').each(function() {
    //
    // deals with the next rule incorrectly hiding content on the Timeline
    // settings page. next rule is kind of an end of the line catchall, so
    // no big deal to deal with it here
    if(curURL.contains("/settings")) return;

    j('.rfloat span.fcg').not('.fbcount').not('.lfloat').not('.fsm').each(function() {
        j(this).addClass('fbcount facebookmetric_hideshow').hide();
    });

    //demetricateTimestamps();
}


// the dropdown for more items on the timeline ribbon, has a metric
// that indicates how many more blocks are available to see
// need to fade it's color to match the background so it doesn't collapse
// (taking the down arrow w/ it)
function demetricateRibbonDropdown() {
    j('.fbTimelineMoreButton').find('.fbTimelineRibbon').find('.text').
        not('.fbribboncounts').each(function() {
            j(this).addClass('fbribboncounts');
            var txt = j(this).text();
            console.log('got here. txt = '+txt);
            j(this).html('<span class="fbRibbonDropdown" style="color:#fff">'+txt+'</span>');
    });
}

function limitedSetTimeout(interval, count, max) {
    console.log("round: "+count);
    count++;
    if(count > max) return;
    else setTimeout(function() {
        limitedSetTimeout(interval, count, max);
    }, interval);
}


// toggles the demetrication of hovercards, those overlays that popup
// for individuals/pages showing name, cover image, mutual friend counts, etc.
function toggleHovercards() {
    
    for(var i = 0; i < 2000; i+=50) {
        delayedToggle(i);
        if(i > 1200) i+=200;
    }

    function delayedToggle(t) {
        setTimeout(function() {
            if(demetricatorON) {
                j('.hovercardcount').hide(); 
                j('.FriendRequestAdd i').hide();
            } else {
                j('.hovercardcount').show(); 
                j('.FriendRequestAdd i').show();
                console.log("tH()");
            }
        }, t);
    }
}

// same as above but for overlays from the ticker
function toggleTickerOverlay() {
    toggleDemetricator();
}

// '3 seconds ago', '4 minutes ago', 'Wednesday', etc.
// attached to all kinds of things throughout the interface
// timestamps are dynamically updated when in the timeline
// here they get converted to either 'recently' or 'a while ago'
function demetricateTimestamps() {
    if(!demetricatorON) return;
    if(FUNCTION_REPORT) console.log("demetricateTimestamps()");
    // adjusts all timestamps to remove the counts of those time segments 
    // (e.g. '8 minutes ago' becomes 'minutes ago')
    j('abbr, .timestamp').not('.fbtimestamp').each(function() {
        var t = j(this).text();
        var newtext;
        var newstamp;

        if(
            t.contains('seconds ago') || 
            t.contains('minutes ago') ||
            t.contains('hours ago') ||
            t.contains('about an hour ago') ||
            t.contains('about a minute ago') ||
            t.contains('at') ||

            t.contains('min') ||
            t.contains('sec') ||
            t.contains('hr') ||


            t.contains('Yesterday') ||
            t.contains('yesterday') ||

            t.contains('am') ||
            t.contains('pm') ||

            (
              (
                t.contains('Monday') || 
                t.contains('Tuesday') || 
                t.contains('Wednesday') || 
                t.contains('Thursday') || 
                t.contains('Friday') || 
                t.contains('Saturday') || 
                t.contains('Sunday') 
              ) && !(
                t.contains('January') ||
                t.contains('February') ||
                t.contains('March') ||
                t.contains('April') ||
                t.contains('May') ||
                t.contains('June') ||
                t.contains('July') ||
                t.contains('August') ||
                t.contains('September') ||
                t.contains('October') ||
                t.contains('November') ||
                t.contains('December') 
              )

            )

           )

           newtext = 'recently';

        else if(

            t.contains('January') ||
            t.contains('February') ||
            t.contains('March') ||
            t.contains('April') ||
            t.contains('May') ||
            t.contains('June') ||
            t.contains('July') ||
            t.contains('August') ||
            t.contains('September') ||
            t.contains('October') ||
            t.contains('November') ||
            t.contains('December') ||

            t.contains('weeks ago') ||
            t.contains('months ago') ||
            t.contains('month ago') ||
            t.contains('years ago') ||
            t.contains('year ago') ||

            t.contains('Sun') ||
            t.contains('Mon') ||
            t.contains('Tue') ||
            t.contains('Wed') ||
            t.contains('Thu') ||
            t.contains('Fri') ||
            t.contains('Sat')
           ) 

           newtext = 'a while ago';

        else return; 

        newstamp = '<abbr title="'+newtext+'" class="timestamp fbtimestamp facebookmetric_toggleON">'+newtext+'</abbr>';
        j(this).before(newstamp);
        j(this).removeAttr('data-utime1').addClass('facebookmetric_toggleOFF fbtimestamp').css('display','none');
    });
}

function demetricateEgoSection(jnode) {
    if(!demetricatorON) return;

        // some newsfeed items, perhaps only those that aren't from a close friend (e.g. friend of
    // friend, or from a liked page/business, etc...) include abbreviated bars of info for
    // likes, shares, and comments.  this should remove all those counts

    // OLD STYLE? 6/13 
    // j('.uiBlingBox .text').not('.facebookmetric_fade').addClass('facebookmetric_fade').css('display','none');
    j('.UFIBlingBoxText').not('.facebookmetric_fade').addClass('facebookmetric_face').css('display','none');

        // ad like counts
    // #pagelet_ego_pane span.fbEmuContext
    // _5vwd newnew
    j('.fbEmuContext, ._5vwd').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

    // small link counts, such as '10 mutual friends' in the 'People You May Know' box
    // OLD STYLE? 6/13
    /*
    j('.home_right_column a.uiLinkSubtle').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });
    */

    // small link counts, such as '10 mutual friends' in the 'People You May Know' box
    var egoprofiletemplate = j('.egoProfileTemplate');

    // 'Recommended Pages' mutual friend counts
    // and +1 icons on recommended friend boxes (a little tricky)
    egoprofiletemplate.find('a').not('.fbmutualfriends').addClass('fbmutualfriends').each(function() { 
        var txt = j(this).text(); 
        if(txt.contains('mutual friend') || txt.contains('other friend')) {
            var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
            //var newhtml = '<span class="facebookmetric_hideshow" style="display:none;">'+
            var newhtml = '<span class="facebookmetric_hideshow" style="display:none;">'+
                parsed[1]+'</span> '+parsed[2];  
            j(this).html(newhtml);
            }

        }

        // handles the +1 icons next to 'Add Friend' text on recommended frirend list
        if(txt.contains('Add Friend')) {
            j(this).addClass('facebookmetric_hideshow_plusone_text').css('padding-left','0px');
            j(this).find('i').addClass('facebookmetric_hideshow_plusone_img').hide();
        }
    });

    // alternate way of getting to +1 icons on ego section
    j('.ego_action a').not('.facebookmetric_hideshow_plusone_text').each(function() {
            j(this).addClass('facebookmetric_hideshow_plusone_text').css('padding-left','0px');
            j(this).find('i').addClass('facebookmetric_hideshow_plusone_img').hide();
    });

    // some Page like counts, such as '9,234,721 people like this.' under Chocolate Chip Cookies
    // added catches for new things showing up in ego section, including
    // added members for groups
    // followers, likes this, like her/him, etc.
    egoprofiletemplate.find('div:not(.ego_action)').not('.fblikethis').each(function() {
        j(this).addClass('fblikethis');
        var txt = j(this).text();
        if(txt.contains('like this') || 
           txt.contains('people play') || 
           txt.contains('like her') || 
           txt.contains('like him') || 
           txt.contains('likes this') || 
           txt.contains('member') || 
           txt.contains('follower')
           ) {
            var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                var newhtml = '<span class="facebookmetric_hideshow" style="display:none;">'+
                    parsed[1]+'</span> '+parsed[2];  
                j(this).html(newhtml);
            }
        }
    });


    // friend finder counts (e.g. 'These 3 friends found their friends using...')
    j('div.ego_contact_importer div.mvs').not('.facebookcount').each(function() {
        wrapNumberInString(this);
    });

}

// Hovercards only exist when dynamicaly inserted, so no reason to put them within the
// main demetricate() function.  This way they're only called when one appears:
// called by waitForKeyElements on appearance of .HovercardContent
function demetricateHovercard(jnode) {

    if(!demetricatorON) return;

    if(DBUG) console.time('demetricateHovercard timer');
    //console.log("hovercard html: "+jnode.parent().parent().parent().parent().html());
    //console.log("hovercard html: "+jnode.html());

    // first look for a mutual friends link
    //var friendslink = jnode.find('.HovercardContent a[rel="dialog"]');
    var friendslink = jnode.find('._7lo a[rel="dialog"]');

    // if we have one, and if it hasn't already been demetricated, then demetricate it
    if(friendslink && friendslink.not('span.hovercardcount, .HovercardMessagesButton')) {
        var html = friendslink.html();
        if(html) {
            var parsed = html.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                if(demetricatorON) var disp = "display:none;";
                else var disp = "";
                var newhtml = '<span class="hovercardcount HERE4" style="'+disp+'">'+parsed[1]+"</span> "+parsed[2];
                friendslink.html(newhtml);
            }
        }
        //return;
    }
    
    else if(friendslink) {
        if(demetricatorON) friendslink.css('display','none');
        else friendslink.removeAttr('style');
    }

    // sometimes hovercards are somewhat different, requiring a separate attempt at demetricating the 
    // mutual friends count
    var altfriendslink = jnode.find('div.mbs a');

    if(altfriendslink && altfriendslink.not('span.hovercardcount, .HovercardMessagesButton')) {
        var althtml = altfriendslink.html();
        if(althtml) {
            var altparsed = althtml.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            if(altparsed) {
                if(demetricatorON) var altdisp = "display:none;";
                else var altdisp = "";
                var altnewhtml = '<span class="hovercardcount HERE5" style="'+altdisp+'">'+altparsed[1]+"</span> "+altparsed[2];
                altfriendslink.html(altnewhtml);
            }
        }
    }

    // +1 on add friend buttons
    //j('.FriendRequestAdd i').not('.hovercardcount, .HovercardMessagesButton').addClass('hovercardcount HERE6').hide();
    //jnode.find('.FriendRequestAdd i').not('.hovercardcount, .HovercardMessagesButton').addClass('hovercardcount HERE6').hide();

    demetricateHovercardFooter(jnode);

    function demetricateHovercardFooter(jnode) {
        var fancount = jnode.find('.fanCount');
        if(fancount) wrapFooterNumber(fancount, 'people');

        jnode.find('.HovercardFooter div.fsm.fwn.fcg').each(function() {
            if(j(this).text().contains('like')) wrapFooterNumber(j(this),'');
            else if(j(this).text().contains('talking')) wrapFooterNumber(j(this),'');
            else if(j(this).text().contains('here')) wrapFooterNumber(j(this),'');
            else if(j(this).text().contains('mutual')) wrapNumberInString(j(this));
            else wrapFooterNumber(j(this),'');

        });

        function wrapFooterNumber(jnode, languageadd) {
            if(languageadd.length) languageadd += " ";
            var txt = jnode.text();

            if(txt.contains('this') || txt.contains('here')) {
                var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    if(demetricatorON) var disp = "display:none;";
                    else var disp = "";
                    var newhtml = '<span class="hovercardcount HERE7" style="'+disp+'">'+
                        parsed[1]+"</span> "+languageadd+parsed[2];
                    if(demetricatorON) var disp = "display:none;";
                    jnode.html(newhtml);
                }
            }
        }

    }

    // some mutual friends counts are different.  this should catch the rest
    jnode.find('a[rel="dialog"]').not('.fbhovercardcount, .HovercardMessagesButton').each(function() {
        j(this).addClass('fbhovercardcount WHAT1');
        var txt = j(this).text();
        if(txt.contains('mutual') || txt.contains('subscribe') || txt.contains('going') || txt.contains('other') || txt.contains('friends')) 
        wrapNumberInString(this);
        //if(j(this).text().contains('mutual') ) wrapNumberInString(this);
    });

    // people like this within hovercards (bands, other pages that 
    // sometimes show up in hovercards via the ticker, etc.)
    jnode.find('.mvs div.fsm.fwn.fcg').not('.fbhovercardcount, .HovercardMessagesButton').each(function() {
        wrapNumberInString(this);
    });



    if(DBUG) console.timeEnd('demetricateHovercard timer');

}

    // accepts a jQuery node, uses a regex to find a number at the beginning of its html text, if it
    // finds it, it wraps that number in a span, hides the number, and puts the rest of the html back 
    // in place.  
    function wrapNumberInString(node) {
        var txt = j(node).html();
        //txt = txt.replace(/\u200e/g,'');
        if(txt) {
            var parsed = txt.match(/^(\d+(?:,\d+)*)\s+(.*)/);
            //var parsed = txt.match(/^(\d+(?:,\d+)*)[\s\u200e]+(.*)/);
            if(parsed) {
                j(node).html(
                    //'<span style="display:none;" class="facebookmetric_hideshow">'+parsed[1]+'</span> '+parsed[2]);
                    '<span style="display:none;" class="facebookmetric_hideshow">'+parsed[1]+' </span>'+parsed[2]);
            }
        }
        j(node).addClass('facebookcount');
    }

/* will get called repeatedly for all of the elements i've asked it to track */
function newContentLoaded(jnode) {
    //console.log("newContentLoaded: "+jnode.selector);
    if(demetricatorON) {
        if(j('body.timelineLayout')) timelineView = true;
        else timelineView = false;

        //console.log('timelineView = '+timelineView);

        if(FUNCTION_REPORT) console.log("calling demetricate from newContentLoaded()");
        demetricate();
    }
}



// mutual friends counts on the message index
function demetricateMessageMutualFriends() {
    j('.mutualFriends').not('.facebookcount').each(function() {
        var txt = j(this).text();
        
        // 'Friends with Someone and 6 others'
        if(txt.contains('with')) {
            j(this).addClass('facebookcount');
            var parsed = txt.match(/^(.*)\s+(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                j(this).html(
                    parsed[1] + ' <span class="facebookmetric_hideshow" style="display:none;">' + 
                    parsed[2] + ' </span>' + 
                    parsed[3]
                );
            }
        } 

        // '28 mutual friends' - easy
        else {
            wrapNumberInString(this);
        }
    });
}




//function fastNewContentLoaded(jnode) {
function demetricateAddFriendButtons(jnode) {
    if(!demetricatorON) return;


    /*
    // friend list +1 icons in the 'add friend' buttons (but not checkmarks on 'Friends' buttons)
    var txt = jnode.find('span.uiButtonText').text(); 
    //if(!txt.contains('Friends')) {
    if(txt.contains('Add Friend')) {
        console.log(txt);
        //jnode.find('i').not('.facebookmetric_hideshow').addClass('facebookmetric_hideshow MYTEST').hide();

        jnode.find('i').not('.facebookcount').each(function() {
            j(this).addClass('facebookcount');
            if(!j(this).hasClass('fbProfileBylineIcon')) 
                j(this).addClass('facebookmetric_hideshow').hide();
        });

    }
    */

    jnode.find('.addButton i').not('.FriendRequestAdd').hide();
//    jnode.find('.addButton').not('.FriendRequestAdd').css('padding-left','0px');

    if(jnode.hasClass('fbProfileBrowserListItem')) {
        if(jnode.find('input[value="Subscribed"]')) return;
        jnode.find('i').not('.facebookmetric_hideshow').addClass('facebookmetric_hideshow').hide();
    }

    // they've added some new stuff to friend blocks so catch it here
    demetricateFriendPageBlocks();

}

// map bubbles get metrics for locations
function demetricateMapBubbles() {
    if(!demetricatorON) return;

    j('.fbAggregatedMapBubble, .fbAggregatedMapPinText').
        not('.facebookcount').each(function() {
        j(this).addClass('facebookcount');
        j(this).html('<span class="facebookmetric_opacity" style="opacity:0">'+
            j(this).text()+
            '</span>'
            );
    });

    j('._15oj.fbAggregatedMapControl').not('.fbgscount').each(function() {
        setTimeout(function() {
            var target = j('._15oj.fbAggregatedMapControl');
            target.addClass('fbgscount');
            target.html(
                '<span class="facebookmetric_toggleOFF" style="display:none;">'+target.text()+'</span>'+
                '<span class="facebookmetric_toggleON"> / </span>'
                );
            console.log('here');
        }, 1500);
    });
}


// -------------------
// GRAPH SEARCH (beta)
// -------------------

// removes metrics from both list and grid view graph search results
function demetricateGraphSearchResults() {
    demetricateGraphSearchSelectorOverview();
    demetricateMapBubbles();

    // run through all links that might contain metrics (e.g. '38 mutual friends')
    j('._-x a').not('.fbgscount').each(function() {
        var txt = j(this).text();
        var parsed = txt.match(/(\d+(?:,\d+)*)\s+(.*)/);
        if(parsed) {
            var newhtml = 
                '<span class="facebookmetric_hideshow" style="display:none;">'+parsed[1]+
                ' </span>'+parsed[2];
            j(this).html(newhtml);
        }

        j(this).addClass('fbgscount');

    });

    // maybe obsolete now , needs redoing

    //console.log("CHECKING GSR");
    //j('.-cx-PUBLIC-fbFacebarTypeaheadToken__subtext').not('.fbgscount').each(function() {
    
    // run through all fields that aren't links
    j('._-x').not('.fbgscount').each(function() {

        var txt = j(this).text();
        console.log("CHECKING: "+txt);
        if(txt.contains('people checked in') || txt.contains('monthly active users') || txt.contains('members')) {
            var parsed = txt.match(/(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                var newhtml = 
                    '<span class="facebookmetric_hideshow" style="display:none;">'+parsed[1]+
                    ' </span>'+parsed[2];
                j(this).html(newhtml);
            }
        } else if(txt.contains('like this') && !txt.contains('other friends')) { 
            console.log("IN LIKE THIS CHECK");
            var parsed = txt.match(/(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                var newhtml =  
                    '<span class="facebookmetric_toggleOFF" style="display:none;">'+parsed[1]+'</span> '+
                    '<span class="facebookmetric_toggleON">people</span> '+
                    parsed[2];  
                j(this).html(newhtml);
            }
        } else if(txt.contains('other albums')) {
            var parsed = txt.match(/(.*\s+)(\d+(?:,\d+)*)\s+(other albums)/);
            if(parsed) {
                var newhtml = parsed[1]+
                    '<span class="facebookmetric_hideshow" style="display:none;">'+parsed[2]+
                    ' </span>'+parsed[3];
                j(this).html(newhtml);
            }

        } else if(txt.contains('mutual friend')) {
            var txt = j(this).text();
            var parsed = txt.match(/(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                var newhtml = 
                    '<span class="facebookmetric_hideshow" style="display:none;">'+parsed[1]+
                    ' </span>'+parsed[2];
                j(this).html(newhtml);
            }

            j(this).addClass('fbgscount');
        }
        

        j(this).addClass('fbgscount');
    });


}


// catches the overlay selector metrics, such as 'More than 1000 Photos'
// also catches metrics in the 'still looking' box
function demetricateGraphSearchSelectorOverview() {
    j('._a6u, ._gj7').not('.fbgscount').each(function() {
        var txt = j(this).text();
        if(txt.contains('More Than') || txt.contains('Fewer Than')) {
            var parsed = txt.match(/(.*\s)(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                var newhtml = parsed[1] +
                    '<span class="facebookmetric_hideshow" style="display:none;">'+parsed[2]+
                    ' </span>'+parsed[3];
                j(this).html(newhtml);
            }
        } else {
            //console.log(txt);
            var parsed = txt.match(/(\d+(?:,\d+)*)\s+(.*)/);
            if(parsed) {
                var newhtml = 
                    '<span class="facebookmetric_hideshow" style="display:none;">'+parsed[1]+
                    ' </span>'+parsed[2];
                j(this).html(newhtml);
            }
        }

        j(this).addClass('fbgscount');
    });

}

// removes metrics that show up in the autosuggest entries (e.g. '38 people like this')
function demetricateGraphSearchAutoSuggest() {
    j('._8ow').not('.fbgscount').each(function() {

        var txt = j(this).text();

        if(txt.contains('like this')) {
                var parsed = txt.match(/^(.*\s)(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed) {
                    var newhtml = parsed[1] + 
                        '<span class="facebookmetric_toggleOFF" style="display:none;">'+parsed[2]+'</span> '+
                        '<span class="facebookmetric_toggleON">people</span> '+
                        parsed[3];  
                    j(this).html(newhtml);
                }
        } else if(txt.contains('monthly users')) {
                var parsed2 = txt.match(/^(.*\s)(\d+(?:,\d+)*)\+\s+(.*)/);
                if(parsed2) {
                    var newhtml = parsed2[1] + 
                        '<span class="facebookmetric_toggleOFF" style="display:none;">'+parsed2[2]+'</span> '+
                        '<span class="facebookmetric_toggleON">some</span> '+
                        parsed2[3];  
                    j(this).html(newhtml);
                }
        } else if(txt.contains('mutual') || txt.contains('members')) {
                var parsed3 = txt.match(/^(.*\s)(\d+(?:,\d+)*)\s+(.*)/);
                if(parsed3) {
                    var newhtml = parsed3[1] + 
                        '<span class="facebookmetric_toggleOFF" style="display:none;">'+parsed3[2]+'</span> '+
                        '<span class="facebookmetric_toggleON"></span> '+
                        parsed3[3];  
                    j(this).html(newhtml);
                }
        }

        j(this).addClass('fbgscount');
    });
}




// watch for a 'new' page.  when the user clicks a FB link (such as 'Home') it appears to 
// load a new page (e.g. the URL changes), but it's really just a dynamic AJAX substitution
// of the exisiting page's content.  so this function watches for a change in location.href,
// and when it finds one it fires off a few demetricate() calls to catch the incoming content
function checkForNewPage() {
    curURL = window.location.href;

    if(curURL != startURL) {
        console.log("Facebook Demetricator --> new page found: "+curURL);

        if(demetricatorON) for(var i = 0; i < 2000; i+=250) delayedDemetricate(i); 

        startURL = curURL;

        // search results pages are narrower than all other pages
        if(startURL.contains("/search/")) {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidthNarrow+"px");
            j('._585-').css('width',newSearchBarWidthNarrow+"px");
        } else {
            j('.-cx-PUBLIC-fbFacebar__root').css('width',newSearchBarWidth+"px");
            j('._585-').css('width',newSearchBarWidth+"px");
        }

    }

    function delayedDemetricate(t) {
        setTimeout(function() { 
            if(demetricatorON) {
                console.log("calling demetricate from delayedDemetricate()");
                demetricate();
            }
        }, t);
    }
}





// waitForKeyElements(): detects and handles dynamically modified AJAX content
// downloaded from: https://gist.github.com/2625891

/* Usage example: 
 
 waitForKeyElements ( "div.comments" , commentCallbackFunction);
 function commentCallbackFunction (jNode) { jNode.text ("Comment changed by waitForKeyElements()."); }

*/

/*
   parameters:

   selectorTxt:    Required. The jQuery selector string that specifies the desired element(s).  
   actionFunction: Required. runs when elements are found. It is passed a jNode to the matched element. 
   bWaitOnce:      Optional. If false, will continue to scan for new elements after first match is found.
   iframeSelector: Optional. If set, identifies the iframe to search. 
*/

function waitForKeyElements (selectorTxt, actionFunction, bWaitOnce, iframeSelector ) {
    //if(demetricating) return;


    var targetNodes, btargetsFound;


    /*
    if (typeof iframeSelector == "undefined") targetNodes = j(selectorTxt);
    else targetNodes = j(iframeSelector).contents().find(selectorTxt);
    */

    targetNodes = j(selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;

        // found target node(s).  go through each and act if they are new.
        targetNodes.each ( function () {
            var jThis        = j(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                // call the payload function.
                //unsafeWindow.console.log("waitFor got a new element: "+selectorTxt);
                var cancelFound = actionFunction (jThis);
                if (cancelFound) btargetsFound = false;
                else jThis.data ('alreadyFound', true);
            }
        } );
    }

    else {
        btargetsFound   = false;
    }

    // get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    // now set or clear the timer as appropriate.
    if (btargetsFound && bWaitOnce && timeControl) {
        // the only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }

    else {
        // set a timer, if needed.
        if (!timeControl) {
            timeControl = setInterval ( function () {
                waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
                }, ELEMENT_POLL_SPEED
            );

            controlObj [controlKey] = timeControl;
        }
    }

    waitForKeyElements.controlObj = controlObj;

    
}




// start
//
//
//
//
//
//

/*! jQuery v1.7.2 jquery.com | jquery.org/license */
(function(a,b){function cy(a){return f.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}function cu(a){if(!cj[a]){var b=c.body,d=f("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){ck||(ck=c.createElement("iframe"),ck.frameBorder=ck.width=ck.height=0),b.appendChild(ck);if(!cl||!ck.createElement)cl=(ck.contentWindow||ck.contentDocument).document,cl.write((f.support.boxModel?"<!doctype html>":"")+"<html><body>"),cl.close();d=cl.createElement(a),cl.body.appendChild(d),e=f.css(d,"display"),b.removeChild(ck)}cj[a]=e}return cj[a]}function ct(a,b){var c={};f.each(cp.concat.apply([],cp.slice(0,b)),function(){c[this]=a});return c}function cs(){cq=b}function cr(){setTimeout(cs,0);return cq=f.now()}function ci(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function ch(){try{return new a.XMLHttpRequest}catch(b){}}function cb(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var d=a.dataTypes,e={},g,h,i=d.length,j,k=d[0],l,m,n,o,p;for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h=="string"&&(e[h.toLowerCase()]=a.converters[h]);l=k,k=d[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=e[m]||e["* "+k];if(!n){p=b;for(o in e){j=o.split(" ");if(j[0]===l||j[0]==="*"){p=e[j[1]+" "+k];if(p){o=e[o],o===!0?n=p:p===!0&&(n=o);break}}}}!n&&!p&&f.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function ca(a,c,d){var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function b_(a,b,c,d){if(f.isArray(b))f.each(b,function(b,e){c||bD.test(a)?d(a,e):b_(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)});else if(!c&&f.type(b)==="object")for(var e in b)b_(a+"["+e+"]",b[e],c,d);else d(a,b)}function b$(a,c){var d,e,g=f.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((g[d]?a:e||(e={}))[d]=c[d]);e&&f.extend(!0,a,e)}function bZ(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bS,l;for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l=="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=bZ(a,c,d,e,l,g)));(k||!l)&&!g["*"]&&(l=bZ(a,c,d,e,"*",g));return l}function bY(a){return function(b,c){typeof b!="string"&&(c=b,b="*");if(f.isFunction(c)){var d=b.toLowerCase().split(bO),e=0,g=d.length,h,i,j;for(;e<g;e++)h=d[e],j=/^\+/.test(h),j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bB(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=b==="width"?1:0,g=4;if(d>0){if(c!=="border")for(;e<g;e+=2)c||(d-=parseFloat(f.css(a,"padding"+bx[e]))||0),c==="margin"?d+=parseFloat(f.css(a,c+bx[e]))||0:d-=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0;return d+"px"}d=by(a,b);if(d<0||d==null)d=a.style[b];if(bt.test(d))return d;d=parseFloat(d)||0;if(c)for(;e<g;e+=2)d+=parseFloat(f.css(a,"padding"+bx[e]))||0,c!=="padding"&&(d+=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0),c==="margin"&&(d+=parseFloat(f.css(a,c+bx[e]))||0);return d+"px"}function bo(a){var b=c.createElement("div");bh.appendChild(b),b.innerHTML=a.outerHTML;return b.firstChild}function bn(a){var b=(a.nodeName||"").toLowerCase();b==="input"?bm(a):b!=="script"&&typeof a.getElementsByTagName!="undefined"&&f.grep(a.getElementsByTagName("input"),bm)}function bm(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function bl(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bk(a,b){var c;b.nodeType===1&&(b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase(),c==="object"?b.outerHTML=a.outerHTML:c!=="input"||a.type!=="checkbox"&&a.type!=="radio"?c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text):(a.checked&&(b.defaultChecked=b.checked=a.checked),b.value!==a.value&&(b.value=a.value)),b.removeAttribute(f.expando),b.removeAttribute("_submit_attached"),b.removeAttribute("_change_attached"))}function bj(a,b){if(b.nodeType===1&&!!f.hasData(a)){var c,d,e,g=f._data(a),h=f._data(b,g),i=g.events;if(i){delete h.handle,h.events={};for(c in i)for(d=0,e=i[c].length;d<e;d++)f.event.add(b,c,i[c][d])}h.data&&(h.data=f.extend({},h.data))}}function bi(a,b){return f.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function U(a){var b=V.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function T(a,b,c){b=b||0;if(f.isFunction(b))return f.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return f.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=f.grep(a,function(a){return a.nodeType===1});if(O.test(b))return f.filter(b,d,!c);b=f.filter(b,d)}return f.grep(a,function(a,d){return f.inArray(a,b)>=0===c})}function S(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function K(){return!0}function J(){return!1}function n(a,b,c){var d=b+"defer",e=b+"queue",g=b+"mark",h=f._data(a,d);h&&(c==="queue"||!f._data(a,e))&&(c==="mark"||!f._data(a,g))&&setTimeout(function(){!f._data(a,e)&&!f._data(a,g)&&(f.removeData(a,d,!0),h.fire())},0)}function m(a){for(var b in a){if(b==="data"&&f.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function l(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(k,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:f.isNumeric(d)?+d:j.test(d)?f.parseJSON(d):d}catch(g){}f.data(a,c,d)}else d=b}return d}function h(a){var b=g[a]={},c,d;a=a.split(/\s+/);for(c=0,d=a.length;c<d;c++)b[a[c]]=!0;return b}var c=a.document,d=a.navigator,e=a.location,f=function(){function J(){if(!e.isReady){try{c.documentElement.doScroll("left")}catch(a){setTimeout(J,1);return}e.ready()}}var e=function(a,b){return new e.fn.init(a,b,h)},f=a.jQuery,g=a.$,h,i=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,j=/\S/,k=/^\s+/,l=/\s+$/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=/-([a-z]|[0-9])/ig,w=/^-ms-/,x=function(a,b){return(b+"").toUpperCase()},y=d.userAgent,z,A,B,C=Object.prototype.toString,D=Object.prototype.hasOwnProperty,E=Array.prototype.push,F=Array.prototype.slice,G=String.prototype.trim,H=Array.prototype.indexOf,I={};e.fn=e.prototype={constructor:e,init:function(a,d,f){var g,h,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,this.length=1;return this}if(a==="body"&&!d&&c.body){this.context=c,this[0]=c.body,this.selector=a,this.length=1;return this}if(typeof a=="string"){a.charAt(0)!=="<"||a.charAt(a.length-1)!==">"||a.length<3?g=i.exec(a):g=[null,a,null];if(g&&(g[1]||!d)){if(g[1]){d=d instanceof e?d[0]:d,k=d?d.ownerDocument||d:c,j=m.exec(a),j?e.isPlainObject(d)?(a=[c.createElement(j[1])],e.fn.attr.call(a,d,!0)):a=[k.createElement(j[1])]:(j=e.buildFragment([g[1]],[k]),a=(j.cacheable?e.clone(j.fragment):j.fragment).childNodes);return e.merge(this,a)}h=c.getElementById(g[2]);if(h&&h.parentNode){if(h.id!==g[2])return f.find(a);this.length=1,this[0]=h}this.context=c,this.selector=a;return this}return!d||d.jquery?(d||f).find(a):this.constructor(d).find(a)}if(e.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);return e.makeArray(a,this)},selector:"",jquery:"1.7.2",length:0,size:function(){return this.length},toArray:function(){return F.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=this.constructor();e.isArray(a)?E.apply(d,a):e.merge(d,a),d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")");return d},each:function(a,b){return e.each(this,a,b)},ready:function(a){e.bindReady(),A.add(a);return this},eq:function(a){a=+a;return a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(F.apply(this,arguments),"slice",F.call(arguments).join(","))},map:function(a){return this.pushStack(e.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice},e.fn.init.prototype=e.fn,e.extend=e.fn.extend=function(){var a,c,d,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i=="boolean"&&(l=i,i=arguments[1]||{},j=2),typeof i!="object"&&!e.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){d=i[c],f=a[c];if(i===f)continue;l&&f&&(e.isPlainObject(f)||(g=e.isArray(f)))?(g?(g=!1,h=d&&e.isArray(d)?d:[]):h=d&&e.isPlainObject(d)?d:{},i[c]=e.extend(l,h,f)):f!==b&&(i[c]=f)}return i},e.extend({noConflict:function(b){a.$===e&&(a.$=g),b&&a.jQuery===e&&(a.jQuery=f);return e},isReady:!1,readyWait:1,holdReady:function(a){a?e.readyWait++:e.ready(!0)},ready:function(a){if(a===!0&&!--e.readyWait||a!==!0&&!e.isReady){if(!c.body)return setTimeout(e.ready,1);e.isReady=!0;if(a!==!0&&--e.readyWait>0)return;A.fireWith(c,[e]),e.fn.trigger&&e(c).trigger("ready").off("ready")}},bindReady:function(){if(!A){A=e.Callbacks("once memory");if(c.readyState==="complete")return setTimeout(e.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",B,!1),a.addEventListener("load",e.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",B),a.attachEvent("onload",e.ready);var b=!1;try{b=a.frameElement==null}catch(d){}c.documentElement.doScroll&&b&&J()}}},isFunction:function(a){return e.type(a)==="function"},isArray:Array.isArray||function(a){return e.type(a)==="array"},isWindow:function(a){return a!=null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):I[C.call(a)]||"object"},isPlainObject:function(a){if(!a||e.type(a)!=="object"||a.nodeType||e.isWindow(a))return!1;try{if(a.constructor&&!D.call(a,"constructor")&&!D.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||D.call(a,d)},isEmptyObject:function(a){for(var b in a)return!1;return!0},error:function(a){throw new Error(a)},parseJSON:function(b){if(typeof b!="string"||!b)return null;b=e.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return(new Function("return "+b))();e.error("Invalid JSON: "+b)},parseXML:function(c){if(typeof c!="string"||!c)return null;var d,f;try{a.DOMParser?(f=new DOMParser,d=f.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(g){d=b}(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&e.error("Invalid XML: "+c);return d},noop:function(){},globalEval:function(b){b&&j.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(w,"ms-").replace(v,x)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,c,d){var f,g=0,h=a.length,i=h===b||e.isFunction(a);if(d){if(i){for(f in a)if(c.apply(a[f],d)===!1)break}else for(;g<h;)if(c.apply(a[g++],d)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break}else for(;g<h;)if(c.call(a[g],g,a[g++])===!1)break;return a},trim:G?function(a){return a==null?"":G.call(a)}:function(a){return a==null?"":(a+"").replace(k,"").replace(l,"")},makeArray:function(a,b){var c=b||[];if(a!=null){var d=e.type(a);a.length==null||d==="string"||d==="function"||d==="regexp"||e.isWindow(a)?E.call(c,a):e.merge(c,a)}return c},inArray:function(a,b,c){var d;if(b){if(H)return H.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length=="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),c!==e&&d.push(a[f]);return d},map:function(a,c,d){var f,g,h=[],i=0,j=a.length,k=a instanceof e||j!==b&&typeof j=="number"&&(j>0&&a[0]&&a[j-1]||j===0||e.isArray(a));if(k)for(;i<j;i++)f=c(a[i],i,d),f!=null&&(h[h.length]=f);else for(g in a)f=c(a[g],g,d),f!=null&&(h[h.length]=f);return h.concat.apply([],h)},guid:1,proxy:function(a,c){if(typeof c=="string"){var d=a[c];c=a,a=d}if(!e.isFunction(a))return b;var f=F.call(arguments,2),g=function(){return a.apply(c,f.concat(F.call(arguments)))};g.guid=a.guid=a.guid||g.guid||e.guid++;return g},access:function(a,c,d,f,g,h,i){var j,k=d==null,l=0,m=a.length;if(d&&typeof d=="object"){for(l in d)e.access(a,c,l,d[l],1,h,f);g=1}else if(f!==b){j=i===b&&e.isFunction(f),k&&(j?(j=c,c=function(a,b,c){return j.call(e(a),c)}):(c.call(a,f),c=null));if(c)for(;l<m;l++)c(a[l],d,j?f.call(a[l],l,c(a[l],d)):f,i);g=1}return g?a:k?c.call(a):m?c(a[0],d):h},now:function(){return(new Date).getTime()},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}e.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function(d,f){f&&f instanceof e&&!(f instanceof a)&&(f=a(f));return e.fn.init.call(this,d,f,b)},a.fn.init.prototype=a.fn;var b=a(c);return a},browser:{}}),e.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){I["[object "+b+"]"]=b.toLowerCase()}),z=e.uaMatch(y),z.browser&&(e.browser[z.browser]=!0,e.browser.version=z.version),e.browser.webkit&&(e.browser.safari=!0),j.test(" ")&&(k=/^[\s\xA0]+/,l=/[\s\xA0]+$/),h=e(c),c.addEventListener?B=function(){c.removeEventListener("DOMContentLoaded",B,!1),e.ready()}:c.attachEvent&&(B=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",B),e.ready())});return e}(),g={};f.Callbacks=function(a){a=a?g[a]||h(a):{};var c=[],d=[],e,i,j,k,l,m,n=function(b){var d,e,g,h,i;for(d=0,e=b.length;d<e;d++)g=b[d],h=f.type(g),h==="array"?n(g):h==="function"&&(!a.unique||!p.has(g))&&c.push(g)},o=function(b,f){f=f||[],e=!a.memory||[b,f],i=!0,j=!0,m=k||0,k=0,l=c.length;for(;c&&m<l;m++)if(c[m].apply(b,f)===!1&&a.stopOnFalse){e=!0;break}j=!1,c&&(a.once?e===!0?p.disable():c=[]:d&&d.length&&(e=d.shift(),p.fireWith(e[0],e[1])))},p={add:function(){if(c){var a=c.length;n(arguments),j?l=c.length:e&&e!==!0&&(k=a,o(e[0],e[1]))}return this},remove:function(){if(c){var b=arguments,d=0,e=b.length;for(;d<e;d++)for(var f=0;f<c.length;f++)if(b[d]===c[f]){j&&f<=l&&(l--,f<=m&&m--),c.splice(f--,1);if(a.unique)break}}return this},has:function(a){if(c){var b=0,d=c.length;for(;b<d;b++)if(a===c[b])return!0}return!1},empty:function(){c=[];return this},disable:function(){c=d=e=b;return this},disabled:function(){return!c},lock:function(){d=b,(!e||e===!0)&&p.disable();return this},locked:function(){return!d},fireWith:function(b,c){d&&(j?a.once||d.push([b,c]):(!a.once||!e)&&o(b,c));return this},fire:function(){p.fireWith(this,arguments);return this},fired:function(){return!!i}};return p};var i=[].slice;f.extend({Deferred:function(a){var b=f.Callbacks("once memory"),c=f.Callbacks("once memory"),d=f.Callbacks("memory"),e="pending",g={resolve:b,reject:c,notify:d},h={done:b.add,fail:c.add,progress:d.add,state:function(){return e},isResolved:b.fired,isRejected:c.fired,then:function(a,b,c){i.done(a).fail(b).progress(c);return this},always:function(){i.done.apply(i,arguments).fail.apply(i,arguments);return this},pipe:function(a,b,c){return f.Deferred(function(d){f.each({done:[a,"resolve"],fail:[b,"reject"],progress:[c,"notify"]},function(a,b){var c=b[0],e=b[1],g;f.isFunction(c)?i[a](function(){g=c.apply(this,arguments),g&&f.isFunction(g.promise)?g.promise().then(d.resolve,d.reject,d.notify):d[e+"With"](this===i?d:this,[g])}):i[a](d[e])})}).promise()},promise:function(a){if(a==null)a=h;else for(var b in h)a[b]=h[b];return a}},i=h.promise({}),j;for(j in g)i[j]=g[j].fire,i[j+"With"]=g[j].fireWith;i.done(function(){e="resolved"},c.disable,d.lock).fail(function(){e="rejected"},b.disable,d.lock),a&&a.call(i,i);return i},when:function(a){function m(a){return function(b){e[a]=arguments.length>1?i.call(arguments,0):b,j.notifyWith(k,e)}}function l(a){return function(c){b[a]=arguments.length>1?i.call(arguments,0):c,--g||j.resolveWith(j,b)}}var b=i.call(arguments,0),c=0,d=b.length,e=Array(d),g=d,h=d,j=d<=1&&a&&f.isFunction(a.promise)?a:f.Deferred(),k=j.promise();if(d>1){for(;c<d;c++)b[c]&&b[c].promise&&f.isFunction(b[c].promise)?b[c].promise().then(l(c),j.reject,m(c)):--g;g||j.resolveWith(j,b)}else j!==a&&j.resolveWith(j,d?[a]:[]);return k}}),f.support=function(){var b,d,e,g,h,i,j,k,l,m,n,o,p=c.createElement("div"),q=c.documentElement;p.setAttribute("className","t"),p.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>",d=p.getElementsByTagName("*"),e=p.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};g=c.createElement("select"),h=g.appendChild(c.createElement("option")),i=p.getElementsByTagName("input")[0],b={leadingWhitespace:p.firstChild.nodeType===3,tbody:!p.getElementsByTagName("tbody").length,htmlSerialize:!!p.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,checkOn:i.value==="on",optSelected:h.selected,getSetAttribute:p.className!=="t",enctype:!!c.createElement("form").enctype,html5Clone:c.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,pixelMargin:!0},f.boxModel=b.boxModel=c.compatMode==="CSS1Compat",i.checked=!0,b.noCloneChecked=i.cloneNode(!0).checked,g.disabled=!0,b.optDisabled=!h.disabled;try{delete p.test}catch(r){b.deleteExpando=!1}!p.addEventListener&&p.attachEvent&&p.fireEvent&&(p.attachEvent("onclick",function(){b.noCloneEvent=!1}),p.cloneNode(!0).fireEvent("onclick")),i=c.createElement("input"),i.value="t",i.setAttribute("type","radio"),b.radioValue=i.value==="t",i.setAttribute("checked","checked"),i.setAttribute("name","t"),p.appendChild(i),j=c.createDocumentFragment(),j.appendChild(p.lastChild),b.checkClone=j.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=i.checked,j.removeChild(i),j.appendChild(p);if(p.attachEvent)for(n in{submit:1,change:1,focusin:1})m="on"+n,o=m in p,o||(p.setAttribute(m,"return;"),o=typeof p[m]=="function"),b[n+"Bubbles"]=o;j.removeChild(p),j=g=h=p=i=null,f(function(){var d,e,g,h,i,j,l,m,n,q,r,s,t,u=c.getElementsByTagName("body")[0];!u||(m=1,t="padding:0;margin:0;border:",r="position:absolute;top:0;left:0;width:1px;height:1px;",s=t+"0;visibility:hidden;",n="style='"+r+t+"5px solid #000;",q="<div "+n+"display:block;'><div style='"+t+"0;display:block;overflow:hidden;'></div></div>"+"<table "+n+"' cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",d=c.createElement("div"),d.style.cssText=s+"width:0;height:0;position:static;top:0;margin-top:"+m+"px",u.insertBefore(d,u.firstChild),p=c.createElement("div"),d.appendChild(p),p.innerHTML="<table><tr><td style='"+t+"0;display:none'></td><td>t</td></tr></table>",k=p.getElementsByTagName("td"),o=k[0].offsetHeight===0,k[0].style.display="",k[1].style.display="none",b.reliableHiddenOffsets=o&&k[0].offsetHeight===0,a.getComputedStyle&&(p.innerHTML="",l=c.createElement("div"),l.style.width="0",l.style.marginRight="0",p.style.width="2px",p.appendChild(l),b.reliableMarginRight=(parseInt((a.getComputedStyle(l,null)||{marginRight:0}).marginRight,10)||0)===0),typeof p.style.zoom!="undefined"&&(p.innerHTML="",p.style.width=p.style.padding="1px",p.style.border=0,p.style.overflow="hidden",p.style.display="inline",p.style.zoom=1,b.inlineBlockNeedsLayout=p.offsetWidth===3,p.style.display="block",p.style.overflow="visible",p.innerHTML="<div style='width:5px;'></div>",b.shrinkWrapBlocks=p.offsetWidth!==3),p.style.cssText=r+s,p.innerHTML=q,e=p.firstChild,g=e.firstChild,i=e.nextSibling.firstChild.firstChild,j={doesNotAddBorder:g.offsetTop!==5,doesAddBorderForTableAndCells:i.offsetTop===5},g.style.position="fixed",g.style.top="20px",j.fixedPosition=g.offsetTop===20||g.offsetTop===15,g.style.position=g.style.top="",e.style.overflow="hidden",e.style.position="relative",j.subtractsBorderForOverflowNotVisible=g.offsetTop===-5,j.doesNotIncludeMarginInBodyOffset=u.offsetTop!==m,a.getComputedStyle&&(p.style.marginTop="1%",b.pixelMargin=(a.getComputedStyle(p,null)||{marginTop:0}).marginTop!=="1%"),typeof d.style.zoom!="undefined"&&(d.style.zoom=1),u.removeChild(d),l=p=d=null,f.extend(b,j))});return b}();var j=/^(?:\{.*\}|\[.*\])$/,k=/([A-Z])/g;f.extend({cache:{},uuid:0,expando:"jQuery"+(f.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?f.cache[a[f.expando]]:a[f.expando];return!!a&&!m(a)},data:function(a,c,d,e){if(!!f.acceptData(a)){var g,h,i,j=f.expando,k=typeof c=="string",l=a.nodeType,m=l?f.cache:a,n=l?a[j]:a[j]&&j,o=c==="events";if((!n||!m[n]||!o&&!e&&!m[n].data)&&k&&d===b)return;n||(l?a[j]=n=++f.uuid:n=j),m[n]||(m[n]={},l||(m[n].toJSON=f.noop));if(typeof c=="object"||typeof c=="function")e?m[n]=f.extend(m[n],c):m[n].data=f.extend(m[n].data,c);g=h=m[n],e||(h.data||(h.data={}),h=h.data),d!==b&&(h[f.camelCase(c)]=d);if(o&&!h[c])return g.events;k?(i=h[c],i==null&&(i=h[f.camelCase(c)])):i=h;return i}},removeData:function(a,b,c){if(!!f.acceptData(a)){var d,e,g,h=f.expando,i=a.nodeType,j=i?f.cache:a,k=i?a[h]:h;if(!j[k])return;if(b){d=c?j[k]:j[k].data;if(d){f.isArray(b)||(b in d?b=[b]:(b=f.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,g=b.length;e<g;e++)delete d[b[e]];if(!(c?m:f.isEmptyObject)(d))return}}if(!c){delete j[k].data;if(!m(j[k]))return}f.support.deleteExpando||!j.setInterval?delete j[k]:j[k]=null,i&&(f.support.deleteExpando?delete a[h]:a.removeAttribute?a.removeAttribute(h):a[h]=null)}},_data:function(a,b,c){return f.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=f.noData[a.nodeName.toLowerCase()];if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),f.fn.extend({data:function(a,c){var d,e,g,h,i,j=this[0],k=0,m=null;if(a===b){if(this.length){m=f.data(j);if(j.nodeType===1&&!f._data(j,"parsedAttrs")){g=j.attributes;for(i=g.length;k<i;k++)h=g[k].name,h.indexOf("data-")===0&&(h=f.camelCase(h.substring(5)),l(j,h,m[h]));f._data(j,"parsedAttrs",!0)}}return m}if(typeof a=="object")return this.each(function(){f.data(this,a)});d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",e=d[1]+"!";return f.access(this,function(c){if(c===b){m=this.triggerHandler("getData"+e,[d[0]]),m===b&&j&&(m=f.data(j,a),m=l(j,a,m));return m===b&&d[1]?this.data(d[0]):m}d[1]=c,this.each(function(){var b=f(this);b.triggerHandler("setData"+e,d),f.data(this,a,c),b.triggerHandler("changeData"+e,d)})},null,c,arguments.length>1,null,!1)},removeData:function(a){return this.each(function(){f.removeData(this,a)})}}),f.extend({_mark:function(a,b){a&&(b=(b||"fx")+"mark",f._data(a,b,(f._data(a,b)||0)+1))},_unmark:function(a,b,c){a!==!0&&(c=b,b=a,a=!1);if(b){c=c||"fx";var d=c+"mark",e=a?0:(f._data(b,d)||1)-1;e?f._data(b,d,e):(f.removeData(b,d,!0),n(b,c,"mark"))}},queue:function(a,b,c){var d;if(a){b=(b||"fx")+"queue",d=f._data(a,b),c&&(!d||f.isArray(c)?d=f._data(a,b,f.makeArray(c)):d.push(c));return d||[]}},dequeue:function(a,b){b=b||"fx";var c=f.queue(a,b),d=c.shift(),e={};d==="inprogress"&&(d=c.shift()),d&&(b==="fx"&&c.unshift("inprogress"),f._data(a,b+".run",e),d.call(a,function(){f.dequeue(a,b)},e)),c.length||(f.removeData(a,b+"queue "+b+".run",!0),n(a,b,"queue"))}}),f.fn.extend({queue:function(a,c){var d=2;typeof a!="string"&&(c=a,a="fx",d--);if(arguments.length<d)return f.queue(this[0],a);return c===b?this:this.each(function(){var b=f.queue(this,a,c);a==="fx"&&b[0]!=="inprogress"&&f.dequeue(this,a)})},dequeue:function(a){return this.each(function(){f.dequeue(this,a)})},delay:function(a,b){a=f.fx?f.fx.speeds[a]||a:a,b=b||"fx";return this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){function m(){--h||d.resolveWith(e,[e])}typeof a!="string"&&(c=a,a=b),a=a||"fx";var d=f.Deferred(),e=this,g=e.length,h=1,i=a+"defer",j=a+"queue",k=a+"mark",l;while(g--)if(l=f.data(e[g],i,b,!0)||(f.data(e[g],j,b,!0)||f.data(e[g],k,b,!0))&&f.data(e[g],i,f.Callbacks("once memory"),!0))h++,l.add(m);m();return d.promise(c)}});var o=/[\n\t\r]/g,p=/\s+/,q=/\r/g,r=/^(?:button|input)$/i,s=/^(?:button|input|object|select|textarea)$/i,t=/^a(?:rea)?$/i,u=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,v=f.support.getSetAttribute,w,x,y;f.fn.extend({attr:function(a,b){return f.access(this,f.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){f.removeAttr(this,a)})},prop:function(a,b){return f.access(this,f.prop,a,b,arguments.length>1)},removeProp:function(a){a=f.propFix[a]||a;return this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,g,h,i;if(f.isFunction(a))return this.each(function(b){f(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(p);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{g=" "+e.className+" ";for(h=0,i=b.length;h<i;h++)~g.indexOf(" "+b[h]+" ")||(g+=b[h]+" ");e.className=f.trim(g)}}}return this},removeClass:function(a){var c,d,e,g,h,i,j;if(f.isFunction(a))return this.each(function(b){f(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(p);for(d=0,e=this.length;d<e;d++){g=this[d];if(g.nodeType===1&&g.className)if(a){h=(" "+g.className+" ").replace(o," ");for(i=0,j=c.length;i<j;i++)h=h.replace(" "+c[i]+" "," ");g.className=f.trim(h)}else g.className=""}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";if(f.isFunction(a))return this.each(function(c){f(this).toggleClass(a.call(this,c,this.className,b),b)});return this.each(function(){if(c==="string"){var e,g=0,h=f(this),i=b,j=a.split(p);while(e=j[g++])i=d?i:!h.hasClass(e),h[i?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&f._data(this,"__className__",this.className),this.className=this.className||a===!1?"":f._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(o," ").indexOf(b)>-1)return!0;return!1},val:function(a){var c,d,e,g=this[0];{if(!!arguments.length){e=f.isFunction(a);return this.each(function(d){var g=f(this),h;if(this.nodeType===1){e?h=a.call(this,d,g.val()):h=a,h==null?h="":typeof h=="number"?h+="":f.isArray(h)&&(h=f.map(h,function(a){return a==null?"":a+""})),c=f.valHooks[this.type]||f.valHooks[this.nodeName.toLowerCase()];if(!c||!("set"in c)||c.set(this,h,"value")===b)this.value=h}})}if(g){c=f.valHooks[g.type]||f.valHooks[g.nodeName.toLowerCase()];if(c&&"get"in c&&(d=c.get(g,"value"))!==b)return d;d=g.value;return typeof d=="string"?d.replace(q,""):d==null?"":d}}}}),f.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,g=a.selectedIndex,h=[],i=a.options,j=a.type==="select-one";if(g<0)return null;c=j?g:0,d=j?g+1:i.length;for(;c<d;c++){e=i[c];if(e.selected&&(f.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!f.nodeName(e.parentNode,"optgroup"))){b=f(e).val();if(j)return b;h.push(b)}}if(j&&!h.length&&i.length)return f(i[g]).val();return h},set:function(a,b){var c=f.makeArray(b);f(a).find("option").each(function(){this.selected=f.inArray(f(this).val(),c)>=0}),c.length||(a.selectedIndex=-1);return c}}},attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0},attr:function(a,c,d,e){var g,h,i,j=a.nodeType;if(!!a&&j!==3&&j!==8&&j!==2){if(e&&c in f.attrFn)return f(a)[c](d);if(typeof a.getAttribute=="undefined")return f.prop(a,c,d);i=j!==1||!f.isXMLDoc(a),i&&(c=c.toLowerCase(),h=f.attrHooks[c]||(u.test(c)?x:w));if(d!==b){if(d===null){f.removeAttr(a,c);return}if(h&&"set"in h&&i&&(g=h.set(a,d,c))!==b)return g;a.setAttribute(c,""+d);return d}if(h&&"get"in h&&i&&(g=h.get(a,c))!==null)return g;g=a.getAttribute(c);return g===null?b:g}},removeAttr:function(a,b){var c,d,e,g,h,i=0;if(b&&a.nodeType===1){d=b.toLowerCase().split(p),g=d.length;for(;i<g;i++)e=d[i],e&&(c=f.propFix[e]||e,h=u.test(e),h||f.attr(a,e,""),a.removeAttribute(v?e:c),h&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(r.test(a.nodeName)&&a.parentNode)f.error("type property can't be changed");else if(!f.support.radioValue&&b==="radio"&&f.nodeName(a,"input")){var c=a.value;a.setAttribute("type",b),c&&(a.value=c);return b}}},value:{get:function(a,b){if(w&&f.nodeName(a,"button"))return w.get(a,b);return b in a?a.value:null},set:function(a,b,c){if(w&&f.nodeName(a,"button"))return w.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,g,h,i=a.nodeType;if(!!a&&i!==3&&i!==8&&i!==2){h=i!==1||!f.isXMLDoc(a),h&&(c=f.propFix[c]||c,g=f.propHooks[c]);return d!==b?g&&"set"in g&&(e=g.set(a,d,c))!==b?e:a[c]=d:g&&"get"in g&&(e=g.get(a,c))!==null?e:a[c]}},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):s.test(a.nodeName)||t.test(a.nodeName)&&a.href?0:b}}}}),f.attrHooks.tabindex=f.propHooks.tabIndex,x={get:function(a,c){var d,e=f.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;b===!1?f.removeAttr(a,c):(d=f.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase()));return c}},v||(y={name:!0,id:!0,coords:!0},w=f.valHooks.button={get:function(a,c){var d;d=a.getAttributeNode(c);return d&&(y[c]?d.nodeValue!=="":d.specified)?d.nodeValue:b},set:function(a,b,d){var e=a.getAttributeNode(d);e||(e=c.createAttribute(d),a.setAttributeNode(e));return e.nodeValue=b+""}},f.attrHooks.tabindex.set=w.set,f.each(["width","height"],function(a,b){f.attrHooks[b]=f.extend(f.attrHooks[b],{set:function(a,c){if(c===""){a.setAttribute(b,"auto");return c}}})}),f.attrHooks.contenteditable={get:w.get,set:function(a,b,c){b===""&&(b="false"),w.set(a,b,c)}}),f.support.hrefNormalized||f.each(["href","src","width","height"],function(a,c){f.attrHooks[c]=f.extend(f.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),f.support.style||(f.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=""+b}}),f.support.optSelected||(f.propHooks.selected=f.extend(f.propHooks.selected,{get:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);return null}})),f.support.enctype||(f.propFix.enctype="encoding"),f.support.checkOn||f.each(["radio","checkbox"],function(){f.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),f.each(["radio","checkbox"],function(){f.valHooks[this]=f.extend(f.valHooks[this],{set:function(a,b){if(f.isArray(b))return a.checked=f.inArray(f(a).val(),b)>=0}})});var z=/^(?:textarea|input|select)$/i,A=/^([^\.]*)?(?:\.(.+))?$/,B=/(?:^|\s)hover(\.\S+)?\b/,C=/^key/,D=/^(?:mouse|contextmenu)|click/,E=/^(?:focusinfocus|focusoutblur)$/,F=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,G=function(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           a){var b=F.exec(a);b&&(b[1]=(b[1]||"").toLowerCase(),b[3]=b[3]&&new RegExp("(?:^|\\s)"+b[3]+"(?:\\s|$)"));return b},H=function(a,b){var c=a.attributes||{};return(!b[1]||a.nodeName.toLowerCase()===b[1])&&(!b[2]||(c.id||{}).value===b[2])&&(!b[3]||b[3].test((c["class"]||{}).value))},I=function(a){return f.event.special.hover?a:a.replace(B,"mouseenter$1 mouseleave$1")};f.event={add:function(a,c,d,e,g){var h,i,j,k,l,m,n,o,p,q,r,s;if(!(a.nodeType===3||a.nodeType===8||!c||!d||!(h=f._data(a)))){d.handler&&(p=d,d=p.handler,g=p.selector),d.guid||(d.guid=f.guid++),j=h.events,j||(h.events=j={}),i=h.handle,i||(h.handle=i=function(a){return typeof f!="undefined"&&(!a||f.event.triggered!==a.type)?f.event.dispatch.apply(i.elem,arguments):b},i.elem=a),c=f.trim(I(c)).split(" ");for(k=0;k<c.length;k++){l=A.exec(c[k])||[],m=l[1],n=(l[2]||"").split(".").sort(),s=f.event.special[m]||{},m=(g?s.delegateType:s.bindType)||m,s=f.event.special[m]||{},o=f.extend({type:m,origType:l[1],data:e,handler:d,guid:d.guid,selector:g,quick:g&&G(g),namespace:n.join(".")},p),r=j[m];if(!r){r=j[m]=[],r.delegateCount=0;if(!s.setup||s.setup.call(a,e,n,i)===!1)a.addEventListener?a.addEventListener(m,i,!1):a.attachEvent&&a.attachEvent("on"+m,i)}s.add&&(s.add.call(a,o),o.handler.guid||(o.handler.guid=d.guid)),g?r.splice(r.delegateCount++,0,o):r.push(o),f.event.global[m]=!0}a=null}},global:{},remove:function(a,b,c,d,e){var g=f.hasData(a)&&f._data(a),h,i,j,k,l,m,n,o,p,q,r,s;if(!!g&&!!(o=g.events)){b=f.trim(I(b||"")).split(" ");for(h=0;h<b.length;h++){i=A.exec(b[h])||[],j=k=i[1],l=i[2];if(!j){for(j in o)f.event.remove(a,j+b[h],c,d,!0);continue}p=f.event.special[j]||{},j=(d?p.delegateType:p.bindType)||j,r=o[j]||[],m=r.length,l=l?new RegExp("(^|\\.)"+l.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(n=0;n<r.length;n++)s=r[n],(e||k===s.origType)&&(!c||c.guid===s.guid)&&(!l||l.test(s.namespace))&&(!d||d===s.selector||d==="**"&&s.selector)&&(r.splice(n--,1),s.selector&&r.delegateCount--,p.remove&&p.remove.call(a,s));r.length===0&&m!==r.length&&((!p.teardown||p.teardown.call(a,l)===!1)&&f.removeEvent(a,j,g.handle),delete o[j])}f.isEmptyObject(o)&&(q=g.handle,q&&(q.elem=null),f.removeData(a,["events","handle"],!0))}},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,e,g){if(!e||e.nodeType!==3&&e.nodeType!==8){var h=c.type||c,i=[],j,k,l,m,n,o,p,q,r,s;if(E.test(h+f.event.triggered))return;h.indexOf("!")>=0&&(h=h.slice(0,-1),k=!0),h.indexOf(".")>=0&&(i=h.split("."),h=i.shift(),i.sort());if((!e||f.event.customEvent[h])&&!f.event.global[h])return;c=typeof c=="object"?c[f.expando]?c:new f.Event(h,c):new f.Event(h),c.type=h,c.isTrigger=!0,c.exclusive=k,c.namespace=i.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+i.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,o=h.indexOf(":")<0?"on"+h:"";if(!e){j=f.cache;for(l in j)j[l].events&&j[l].events[h]&&f.event.trigger(c,d,j[l].handle.elem,!0);return}c.result=b,c.target||(c.target=e),d=d!=null?f.makeArray(d):[],d.unshift(c),p=f.event.special[h]||{};if(p.trigger&&p.trigger.apply(e,d)===!1)return;r=[[e,p.bindType||h]];if(!g&&!p.noBubble&&!f.isWindow(e)){s=p.delegateType||h,m=E.test(s+h)?e:e.parentNode,n=null;for(;m;m=m.parentNode)r.push([m,s]),n=m;n&&n===e.ownerDocument&&r.push([n.defaultView||n.parentWindow||a,s])}for(l=0;l<r.length&&!c.isPropagationStopped();l++)m=r[l][0],c.type=r[l][1],q=(f._data(m,"events")||{})[c.type]&&f._data(m,"handle"),q&&q.apply(m,d),q=o&&m[o],q&&f.acceptData(m)&&q.apply(m,d)===!1&&c.preventDefault();c.type=h,!g&&!c.isDefaultPrevented()&&(!p._default||p._default.apply(e.ownerDocument,d)===!1)&&(h!=="click"||!f.nodeName(e,"a"))&&f.acceptData(e)&&o&&e[h]&&(h!=="focus"&&h!=="blur"||c.target.offsetWidth!==0)&&!f.isWindow(e)&&(n=e[o],n&&(e[o]=null),f.event.triggered=h,e[h](),f.event.triggered=b,n&&(e[o]=n));return c.result}},dispatch:function(c){c=f.event.fix(c||a.event);var d=(f._data(this,"events")||{})[c.type]||[],e=d.delegateCount,g=[].slice.call(arguments,0),h=!c.exclusive&&!c.namespace,i=f.event.special[c.type]||{},j=[],k,l,m,n,o,p,q,r,s,t,u;g[0]=c,c.delegateTarget=this;if(!i.preDispatch||i.preDispatch.call(this,c)!==!1){if(e&&(!c.button||c.type!=="click")){n=f(this),n.context=this.ownerDocument||this;for(m=c.target;m!=this;m=m.parentNode||this)if(m.disabled!==!0){p={},r=[],n[0]=m;for(k=0;k<e;k++)s=d[k],t=s.selector,p[t]===b&&(p[t]=s.quick?H(m,s.quick):n.is(t)),p[t]&&r.push(s);r.length&&j.push({elem:m,matches:r})}}d.length>e&&j.push({elem:this,matches:d.slice(e)});for(k=0;k<j.length&&!c.isPropagationStopped();k++){q=j[k],c.currentTarget=q.elem;for(l=0;l<q.matches.length&&!c.isImmediatePropagationStopped();l++){s=q.matches[l];if(h||!c.namespace&&!s.namespace||c.namespace_re&&c.namespace_re.test(s.namespace))c.data=s.data,c.handleObj=s,o=((f.event.special[s.origType]||{}).handle||s.handler).apply(q.elem,g),o!==b&&(c.result=o,o===!1&&(c.preventDefault(),c.stopPropagation()))}}i.postDispatch&&i.postDispatch.call(this,c);return c.result}},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode);return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,d){var e,f,g,h=d.button,i=d.fromElement;a.pageX==null&&d.clientX!=null&&(e=a.target.ownerDocument||c,f=e.documentElement,g=e.body,a.pageX=d.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=d.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?d.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0);return a}},fix:function(a){if(a[f.expando])return a;var d,e,g=a,h=f.event.fixHooks[a.type]||{},i=h.props?this.props.concat(h.props):this.props;a=f.Event(g);for(d=i.length;d;)e=i[--d],a[e]=g[e];a.target||(a.target=g.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey===b&&(a.metaKey=a.ctrlKey);return h.filter?h.filter(a,g):a},special:{ready:{setup:f.bindReady},load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){f.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=f.extend(new f.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?f.event.trigger(e,null,b):f.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},f.event.handle=f.event.dispatch,f.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},f.Event=function(a,b){if(!(this instanceof f.Event))return new f.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?K:J):this.type=a,b&&f.extend(this,b),this.timeStamp=a&&a.timeStamp||f.now(),this[f.expando]=!0},f.Event.prototype={preventDefault:function(){this.isDefaultPrevented=K;var a=this.originalEvent;!a||(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){this.isPropagationStopped=K;var a=this.originalEvent;!a||(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=K,this.stopPropagation()},isDefaultPrevented:J,isPropagationStopped:J,isImmediatePropagationStopped:J},f.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){f.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c=this,d=a.relatedTarget,e=a.handleObj,g=e.selector,h;if(!d||d!==c&&!f.contains(c,d))a.type=e.origType,h=e.handler.apply(this,arguments),a.type=b;return h}}}),f.support.submitBubbles||(f.event.special.submit={setup:function(){if(f.nodeName(this,"form"))return!1;f.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=f.nodeName(c,"input")||f.nodeName(c,"button")?c.form:b;d&&!d._submit_attached&&(f.event.add(d,"submit._submit",function(a){a._submit_bubble=!0}),d._submit_attached=!0)})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&f.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){if(f.nodeName(this,"form"))return!1;f.event.remove(this,"._submit")}}),f.support.changeBubbles||(f.event.special.change={setup:function(){if(z.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")f.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),f.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1,f.event.simulate("change",this,a,!0))});return!1}f.event.add(this,"beforeactivate._change",function(a){var b=a.target;z.test(b.nodeName)&&!b._change_attached&&(f.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&f.event.simulate("change",this.parentNode,a,!0)}),b._change_attached=!0)})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){f.event.remove(this,"._change");return z.test(this.nodeName)}}),f.support.focusinBubbles||f.each({focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){f.event.simulate(b,a.target,f.event.fix(a),!0)};f.event.special[b]={setup:function(){d++===0&&c.addEventListener(a,e,!0)},teardown:function(){--d===0&&c.removeEventListener(a,e,!0)}}}),f.fn.extend({on:function(a,c,d,e,g){var h,i;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);for(i in a)this.on(i,c,d,a[i],g);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=J;else if(!e)return this;g===1&&(h=e,e=function(a){f().off(a);return h.apply(this,arguments)},e.guid=h.guid||(h.guid=f.guid++));return this.each(function(){f.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){if(a&&a.preventDefault&&a.handleObj){var e=a.handleObj;f(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler);return this}if(typeof a=="object"){for(var g in a)this.off(g,c,a[g]);return this}if(c===!1||typeof c=="function")d=c,c=b;d===!1&&(d=J);return this.each(function(){f.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){f(this.context).on(a,this.selector,b,c);return this},die:function(a,b){f(this.context).off(a,this.selector||"**",b);return this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length==1?this.off(a,"**"):this.off(b,a,c)},trigger:function(a,b){return this.each(function(){f.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return f.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||f.guid++,d=0,e=function(c){var e=(f._data(this,"lastToggle"+a.guid)||0)%d;f._data(this,"lastToggle"+a.guid,e+1),c.preventDefault();return b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){f.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.on(b,null,a,c):this.trigger(b)},f.attrFn&&(f.attrFn[b]=!0),C.test(b)&&(f.event.fixHooks[b]=f.event.keyHooks),D.test(b)&&(f.event.fixHooks[b]=f.event.mouseHooks)}),function(){function x(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}if(j.nodeType===1){g||(j[d]=c,j.sizset=h);if(typeof b!="string"){if(j===b){k=!0;break}}else if(m.filter(b,[j]).length>0){k=j;break}}j=j[a]}e[h]=k}}}function w(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}j.nodeType===1&&!g&&(j[d]=c,j.sizset=h);if(j.nodeName.toLowerCase()===b){k=j;break}j=j[a]}e[h]=k}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,d="sizcache"+(Math.random()+"").replace(".",""),e=0,g=Object.prototype.toString,h=!1,i=!0,j=/\\/g,k=/\r\n/g,l=/\W/;[0,0].sort(function(){i=!1;return 0});var m=function(b,d,e,f){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];if(!b||typeof b!="string")return e;var i,j,k,l,n,q,r,t,u=!0,v=m.isXML(d),w=[],x=b;do{a.exec(""),i=a.exec(x);if(i){x=i[3],w.push(i[1]);if(i[2]){l=i[3];break}}}while(i);if(w.length>1&&p.exec(b))if(w.length===2&&o.relative[w[0]])j=y(w[0]+w[1],d,f);else{j=o.relative[w[0]]?[d]:m(w.shift(),d);while(w.length)b=w.shift(),o.relative[b]&&(b+=w.shift()),j=y(b,j,f)}else{!f&&w.length>1&&d.nodeType===9&&!v&&o.match.ID.test(w[0])&&!o.match.ID.test(w[w.length-1])&&(n=m.find(w.shift(),d,v),d=n.expr?m.filter(n.expr,n.set)[0]:n.set[0]);if(d){n=f?{expr:w.pop(),set:s(f)}:m.find(w.pop(),w.length===1&&(w[0]==="~"||w[0]==="+")&&d.parentNode?d.parentNode:d,v),j=n.expr?m.filter(n.expr,n.set):n.set,w.length>0?k=s(j):u=!1;while(w.length)q=w.pop(),r=q,o.relative[q]?r=w.pop():q="",r==null&&(r=d),o.relative[q](k,r,v)}else k=w=[]}k||(k=j),k||m.error(q||b);if(g.call(k)==="[object Array]")if(!u)e.push.apply(e,k);else if(d&&d.nodeType===1)for(t=0;k[t]!=null;t++)k[t]&&(k[t]===!0||k[t].nodeType===1&&m.contains(d,k[t]))&&e.push(j[t]);else for(t=0;k[t]!=null;t++)k[t]&&k[t].nodeType===1&&e.push(j[t]);else s(k,e);l&&(m(l,h,e,f),m.uniqueSort(e));return e};m.uniqueSort=function(a){if(u){h=i,a.sort(u);if(h)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a},m.matches=function(a,b){return m(a,null,null,b)},m.matchesSelector=function(a,b){return m(b,null,null,[a]).length>0},m.find=function(a,b,c){var d,e,f,g,h,i;if(!a)return[];for(e=0,f=o.order.length;e<f;e++){h=o.order[e];if(g=o.leftMatch[h].exec(a)){i=g[1],g.splice(1,1);if(i.substr(i.length-1)!=="\\"){g[1]=(g[1]||"").replace(j,""),d=o.find[h](g,b,c);if(d!=null){a=a.replace(o.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!="undefined"?b.getElementsByTagName("*"):[]);return{set:d,expr:a}},m.filter=function(a,c,d,e){var f,g,h,i,j,k,l,n,p,q=a,r=[],s=c,t=c&&c[0]&&m.isXML(c[0]);while(a&&c.length){for(h in o.filter)if((f=o.leftMatch[h].exec(a))!=null&&f[2]){k=o.filter[h],l=f[1],g=!1,f.splice(1,1);if(l.substr(l.length-1)==="\\")continue;s===r&&(r=[]);if(o.preFilter[h]){f=o.preFilter[h](f,s,d,r,e,t);if(!f)g=i=!0;else if(f===!0)continue}if(f)for(n=0;(j=s[n])!=null;n++)j&&(i=k(j,f,n,s),p=e^i,d&&i!=null?p?g=!0:s[n]=!1:p&&(r.push(j),g=!0));if(i!==b){d||(s=r),a=a.replace(o.match[h],"");if(!g)return[];break}}if(a===q)if(g==null)m.error(a);else break;q=a}return s},m.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)};var n=m.getText=function(a){var b,c,d=a.nodeType,e="";if(d){if(d===1||d===9||d===11){if(typeof a.textContent=="string")return a.textContent;if(typeof a.innerText=="string")return a.innerText.replace(k,"");for(a=a.firstChild;a;a=a.nextSibling)e+=n(a)}else if(d===3||d===4)return a.nodeValue}else for(b=0;c=a[b];b++)c.nodeType!==8&&(e+=n(c));return e},o=m.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b=="string",d=c&&!l.test(b),e=c&&!d;d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1);a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&m.filter(b,a,!0)},">":function(a,b){var c,d=typeof b=="string",e=0,f=a.length;if(d&&!l.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&m.filter(b,a,!0)}},"":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("parentNode",b,f,a,d,c)},"~":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("previousSibling",b,f,a,d,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!="undefined"&&!c){var d=b.getElementById(a[1]);return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!="undefined"){var c=[],d=b.getElementsByName(a[1]);for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c}},TAG:function(a,b){if(typeof b.getElementsByTagName!="undefined")return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(j,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));return!1},ID:function(a){return a[1].replace(j,"")},TAG:function(a,b){return a[1].replace(j,"").toLowerCase()},CHILD:function(a){if(a[1]==="nth"){a[2]||m.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&m.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){var g=a[1]=a[1].replace(j,"");!f&&o.attrMap[g]&&(a[1]=o.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(j,""),a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=m(b[3],null,null,c);else{var g=m.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(o.match.POS.test(b[0])||o.match.CHILD.test(b[0]))return!0;return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden"},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!m(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){var b=a.getAttribute("type"),c=a.type;return a.nodeName.toLowerCase()==="input"&&"text"===c&&(b===c||b===null)},radio:function(a){return a.nodeName.toLowerCase()==="input"&&"radio"===a.type},checkbox:function(a){return a.nodeName.toLowerCase()==="input"&&"checkbox"===a.type},file:function(a){return a.nodeName.toLowerCase()==="input"&&"file"===a.type},password:function(a){return a.nodeName.toLowerCase()==="input"&&"password"===a.type},submit:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"submit"===a.type},image:function(a){return a.nodeName.toLowerCase()==="input"&&"image"===a.type},reset:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"reset"===a.type},button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&"button"===a.type||b==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)},focus:function(a){return a===a.ownerDocument.activeElement}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=o.filters[e];if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||n([a])||"").indexOf(b[3])>=0;if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}m.error(e)},CHILD:function(a,b){var c,e,f,g,h,i,j,k=b[1],l=a;switch(k){case"only":case"first":while(l=l.previousSibling)if(l.nodeType===1)return!1;if(k==="first")return!0;l=a;case"last":while(l=l.nextSibling)if(l.nodeType===1)return!1;return!0;case"nth":c=b[2],e=b[3];if(c===1&&e===0)return!0;f=b[0],g=a.parentNode;if(g&&(g[d]!==f||!a.nodeIndex)){i=0;for(l=g.firstChild;l;l=l.nextSibling)l.nodeType===1&&(l.nodeIndex=++i);g[d]=f}j=a.nodeIndex-e;return c===0?j===0:j%c===0&&j/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||!!a.nodeName&&a.nodeName.toLowerCase()===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=m.attr?m.attr(a,c):o.attrHandle[c]?o.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];return d==null?f==="!=":!f&&m.attr?d!=null:f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1},POS:function(a,b,c,d){var e=b[2],f=o.setFilters[e];if(f)return f(a,c,b,d)}}},p=o.match.POS,q=function(a,b){return"\\"+(b-0+1)};for(var r in o.match)o.match[r]=new RegExp(o.match[r].source+/(?![^\[]*\])(?![^\(]*\))/.source),o.leftMatch[r]=new RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[r].source.replace(/\\(\d+)/g,q));o.match.globalPOS=p;var s=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(t){s=function(a,b){var c=0,d=b||[];if(g.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length=="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);return d}}var u,v;c.documentElement.compareDocumentPosition?u=function(a,b){if(a===b){h=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;return a.compareDocumentPosition(b)&4?-1:1}:(u=function(a,b){if(a===b){h=!0;return 0}if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,i=b.parentNode,j=g;if(g===i)return v(a,b);if(!g)return-1;if(!i)return 1;while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return v(e[k],f[k]);return k===c?v(a,f[k],-1):v(e[k],b,1)},v=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}),function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(o.find.ID=function(a,c,d){if(typeof c.getElementById!="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[]}},o.filter.ID=function(a,b){var c=typeof a.getAttributeNode!="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),a.getElementsByTagName("*").length>0&&(o.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(o.attrHandle.href=function(a){return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=m,b=c.createElement("div"),d="__sizzle__";b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){m=function(b,e,f,g){e=e||c;if(!g&&!m.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){if(h[1])return s(e.getElementsByTagName(b),f);if(h[2]&&o.find.CLASS&&e.getElementsByClassName)return s(e.getElementsByClassName(h[2]),f)}if(e.nodeType===9){if(b==="body"&&e.body)return s([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);if(!i||!i.parentNode)return s([],f);if(i.id===h[3])return s([i],f)}try{return s(e.querySelectorAll(b),f)}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var k=e,l=e.getAttribute("id"),n=l||d,p=e.parentNode,q=/^\s*[+~]/.test(b);l?n=n.replace(/'/g,"\\$&"):e.setAttribute("id",n),q&&p&&(e=e.parentNode);try{if(!q||p)return s(e.querySelectorAll("[id='"+n+"'] "+b),f)}catch(r){}finally{l||k.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)m[e]=a[e];b=null}}(),function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector;if(b){var d=!b.call(c.createElement("div"),"div"),e=!1;try{b.call(c.documentElement,"[test!='']:sizzle")}catch(f){e=!0}m.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!m.isXML(a))try{if(e||!o.match.PSEUDO.test(c)&&!/!=/.test(c)){var f=b.call(a,c);if(f||!d||a.document&&a.document.nodeType!==11)return f}}catch(g){}return m(c,null,null,[a]).length>0}}}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(!!a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;o.order.splice(1,0,"CLASS"),o.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!="undefined"&&!c)return b.getElementsByClassName(a[1])},a=null}}(),c.documentElement.contains?m.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0)}:c.documentElement.compareDocumentPosition?m.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16)}:m.contains=function(){return!1},m.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1};var y=function(a,b,c){var d,e=[],f="",g=b.nodeType?[b]:b;while(d=o.match.PSEUDO.exec(a))f+=d[0],a=a.replace(o.match.PSEUDO,"");a=o.relative[a]?a+"*":a;for(var h=0,i=g.length;h<i;h++)m(a,g[h],e,c);return m.filter(f,e)};m.attr=f.attr,m.selectors.attrMap={},f.find=m,f.expr=m.selectors,f.expr[":"]=f.expr.filters,f.unique=m.uniqueSort,f.text=m.getText,f.isXMLDoc=m.isXML,f.contains=m.contains}();var L=/Until$/,M=/^(?:parents|prevUntil|prevAll)/,N=/,/,O=/^.[^:#\[\.,]*$/,P=Array.prototype.slice,Q=f.expr.match.globalPOS,R={children:!0,contents:!0,next:!0,prev:!0};f.fn.extend({find:function(a){var b=this,c,d;if(typeof a!="string")return f(a).filter(function(){for(c=0,d=b.length;c<d;c++)if(f.contains(b[c],this))return!0});var e=this.pushStack("","find",a),g,h,i;for(c=0,d=this.length;c<d;c++){g=e.length,f.find(a,this[c],e);if(c>0)for(h=g;h<e.length;h++)for(i=0;i<g;i++)if(e[i]===e[h]){e.splice(h--,1);break}}return e},has:function(a){var b=f(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(f.contains(this,b[a]))return!0})},not:function(a){return this.pushStack(T(this,a,!1),"not",a)},filter:function(a){return this.pushStack(T(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?Q.test(a)?f(a,this.context).index(this[0])>=0:f.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c=[],d,e,g=this[0];if(f.isArray(a)){var h=1;while(g&&g.ownerDocument&&g!==b){for(d=0;d<a.length;d++)f(g).is(a[d])&&c.push({selector:a[d],elem:g,level:h});g=g.parentNode,h++}return c}var i=Q.test(a)||typeof a!="string"?f(a,b||this.context):0;for(d=0,e=this.length;d<e;d++){g=this[d];while(g){if(i?i.index(g)>-1:f.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break}}c=c.length>1?f.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a)return this[0]&&this[0].parentNode?this.prevAll().length:-1;if(typeof a=="string")return f.inArray(this[0],f(a));return f.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var c=typeof a=="string"?f(a,b):f.makeArray(a&&a.nodeType?[a]:a),d=f.merge(this.get(),c);return this.pushStack(S(c[0])||S(d[0])?d:f.unique(d))},andSelf:function(){return this.add(this.prevObject)}}),f.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return f.dir(a,"parentNode")},parentsUntil:function(a,b,c){return f.dir(a,"parentNode",c)},next:function(a){return f.nth(a,2,"nextSibling")},prev:function(a){return f.nth(a,2,"previousSibling")},nextAll:function(a){return f.dir(a,"nextSibling")},prevAll:function(a){return f.dir(a,"previousSibling")},nextUntil:function(a,b,c){return f.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return f.dir(a,"previousSibling",c)},siblings:function(a){return f.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return f.sibling(a.firstChild)},contents:function(a){return f.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:f.makeArray(a.childNodes)}},function(a,b){f.fn[a]=function(c,d){var e=f.map(this,b,c);L.test(a)||(d=c),d&&typeof d=="string"&&(e=f.filter(d,e)),e=this.length>1&&!R[a]?f.unique(e):e,(this.length>1||N.test(d))&&M.test(a)&&(e=e.reverse());return this.pushStack(e,a,P.call(arguments).join(","))}}),f.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?f.find.matchesSelector(b[0],a)?[b[0]]:[]:f.find.matches(a,b)},dir:function(a,c,d){var e=[],g=a[c];while(g&&g.nodeType!==9&&(d===b||g.nodeType!==1||!f(g).is(d)))g.nodeType===1&&e.push(g),g=g[c];return e},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var V="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",W=/ jQuery\d+="(?:\d+|null)"/g,X=/^\s+/,Y=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,Z=/<([\w:]+)/,$=/<tbody/i,_=/<|&#?\w+;/,ba=/<(?:script|style)/i,bb=/<(?:script|object|embed|option|style)/i,bc=new RegExp("<(?:"+V+")[\\s/>]","i"),bd=/checked\s*(?:[^=]|=\s*.checked.)/i,be=/\/(java|ecma)script/i,bf=/^\s*<!(?:\[CDATA\[|\-\-)/,bg={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bh=U(c);bg.optgroup=bg.option,bg.tbody=bg.tfoot=bg.colgroup=bg.caption=bg.thead,bg.th=bg.td,f.support.htmlSerialize||(bg._default=[1,"div<div>","</div>"]),f.fn.extend({text:function(a){return f.access(this,function(a){return a===b?f.text(this):this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapAll(a.call(this,b))});if(this[0]){var b=f(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapInner(a.call(this,b))});return this.each(function(){var b=f(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=f.isFunction(a);return this.each(function(c){f(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){f.nodeName(this,"body")||f(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=f
    .clean(arguments);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,f.clean(arguments));return a}},remove:function(a,b){for(var c=0,d;(d=this[c])!=null;c++)if(!a||f.filter(a,[d]).length)!b&&d.nodeType===1&&(f.cleanData(d.getElementsByTagName("*")),f.cleanData([d])),d.parentNode&&d.parentNode.removeChild(d);return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++){b.nodeType===1&&f.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild)}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return f.clone(this,a,b)})},html:function(a){return f.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return c.nodeType===1?c.innerHTML.replace(W,""):null;if(typeof a=="string"&&!ba.test(a)&&(f.support.leadingWhitespace||!X.test(a))&&!bg[(Z.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Y,"<$1></$2>");try{for(;d<e;d++)c=this[d]||{},c.nodeType===1&&(f.cleanData(c.getElementsByTagName("*")),c.innerHTML=a);c=0}catch(g){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(f.isFunction(a))return this.each(function(b){var c=f(this),d=c.html();c.replaceWith(a.call(this,b,d))});typeof a!="string"&&(a=f(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;f(this).remove(),b?f(b).before(a):f(c).append(a)})}return this.length?this.pushStack(f(f.isFunction(a)?a():a),"replaceWith",a):this},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){var e,g,h,i,j=a[0],k=[];if(!f.support.checkClone&&arguments.length===3&&typeof j=="string"&&bd.test(j))return this.each(function(){f(this).domManip(a,c,d,!0)});if(f.isFunction(j))return this.each(function(e){var g=f(this);a[0]=j.call(this,e,c?g.html():b),g.domManip(a,c,d)});if(this[0]){i=j&&j.parentNode,f.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?e={fragment:i}:e=f.buildFragment(a,this,k),h=e.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;if(g){c=c&&f.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)d.call(c?bi(this[l],g):this[l],e.cacheable||m>1&&l<n?f.clone(h,!0,!0):h)}k.length&&f.each(k,function(a,b){b.src?f.ajax({type:"GET",global:!1,url:b.src,async:!1,dataType:"script"}):f.globalEval((b.text||b.textContent||b.innerHTML||"").replace(bf,"/*$0*/")),b.parentNode&&b.parentNode.removeChild(b)})}return this}}),f.buildFragment=function(a,b,d){var e,g,h,i,j=a[0];b&&b[0]&&(i=b[0].ownerDocument||b[0]),i.createDocumentFragment||(i=c),a.length===1&&typeof j=="string"&&j.length<512&&i===c&&j.charAt(0)==="<"&&!bb.test(j)&&(f.support.checkClone||!bd.test(j))&&(f.support.html5Clone||!bc.test(j))&&(g=!0,h=f.fragments[j],h&&h!==1&&(e=h)),e||(e=i.createDocumentFragment(),f.clean(a,i,e,d)),g&&(f.fragments[j]=h?e:1);return{fragment:e,cacheable:g}},f.fragments={},f.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){f.fn[a]=function(c){var d=[],e=f(c),g=this.length===1&&this[0].parentNode;if(g&&g.nodeType===11&&g.childNodes.length===1&&e.length===1){e[b](this[0]);return this}for(var h=0,i=e.length;h<i;h++){var j=(h>0?this.clone(!0):this).get();f(e[h])[b](j),d=d.concat(j)}return this.pushStack(d,a,e.selector)}}),f.extend({clone:function(a,b,c){var d,e,g,h=f.support.html5Clone||f.isXMLDoc(a)||!bc.test("<"+a.nodeName+">")?a.cloneNode(!0):bo(a);if((!f.support.noCloneEvent||!f.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!f.isXMLDoc(a)){bk(a,h),d=bl(a),e=bl(h);for(g=0;d[g];++g)e[g]&&bk(d[g],e[g])}if(b){bj(a,h);if(c){d=bl(a),e=bl(h);for(g=0;d[g];++g)bj(d[g],e[g])}}d=e=null;return h},clean:function(a,b,d,e){var g,h,i,j=[];b=b||c,typeof b.createElement=="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);for(var k=0,l;(l=a[k])!=null;k++){typeof l=="number"&&(l+="");if(!l)continue;if(typeof l=="string")if(!_.test(l))l=b.createTextNode(l);else{l=l.replace(Y,"<$1></$2>");var m=(Z.exec(l)||["",""])[1].toLowerCase(),n=bg[m]||bg._default,o=n[0],p=b.createElement("div"),q=bh.childNodes,r;b===c?bh.appendChild(p):U(b).appendChild(p),p.innerHTML=n[1]+l+n[2];while(o--)p=p.lastChild;if(!f.support.tbody){var s=$.test(l),t=m==="table"&&!s?p.firstChild&&p.firstChild.childNodes:n[1]==="<table>"&&!s?p.childNodes:[];for(i=t.length-1;i>=0;--i)f.nodeName(t[i],"tbody")&&!t[i].childNodes.length&&t[i].parentNode.removeChild(t[i])}!f.support.leadingWhitespace&&X.test(l)&&p.insertBefore(b.createTextNode(X.exec(l)[0]),p.firstChild),l=p.childNodes,p&&(p.parentNode.removeChild(p),q.length>0&&(r=q[q.length-1],r&&r.parentNode&&r.parentNode.removeChild(r)))}var u;if(!f.support.appendChecked)if(l[0]&&typeof (u=l.length)=="number")for(i=0;i<u;i++)bn(l[i]);else bn(l);l.nodeType?j.push(l):j=f.merge(j,l)}if(d){g=function(a){return!a.type||be.test(a.type)};for(k=0;j[k];k++){h=j[k];if(e&&f.nodeName(h,"script")&&(!h.type||be.test(h.type)))e.push(h.parentNode?h.parentNode.removeChild(h):h);else{if(h.nodeType===1){var v=f.grep(h.getElementsByTagName("script"),g);j.splice.apply(j,[k+1,0].concat(v))}d.appendChild(h)}}}return j},cleanData:function(a){var b,c,d=f.cache,e=f.event.special,g=f.support.deleteExpando;for(var h=0,i;(i=a[h])!=null;h++){if(i.nodeName&&f.noData[i.nodeName.toLowerCase()])continue;c=i[f.expando];if(c){b=d[c];if(b&&b.events){for(var j in b.events)e[j]?f.event.remove(i,j):f.removeEvent(i,j,b.handle);b.handle&&(b.handle.elem=null)}g?delete i[f.expando]:i.removeAttribute&&i.removeAttribute(f.expando),delete d[c]}}}});var bp=/alpha\([^)]*\)/i,bq=/opacity=([^)]*)/,br=/([A-Z]|^ms)/g,bs=/^[\-+]?(?:\d*\.)?\d+$/i,bt=/^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,bu=/^([\-+])=([\-+.\de]+)/,bv=/^margin/,bw={position:"absolute",visibility:"hidden",display:"block"},bx=["Top","Right","Bottom","Left"],by,bz,bA;f.fn.css=function(a,c){return f.access(this,function(a,c,d){return d!==b?f.style(a,c,d):f.css(a,c)},a,c,arguments.length>1)},f.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=by(a,"opacity");return c===""?"1":c}return a.style.opacity}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":f.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!!a&&a.nodeType!==3&&a.nodeType!==8&&!!a.style){var g,h,i=f.camelCase(c),j=a.style,k=f.cssHooks[i];c=f.cssProps[i]||i;if(d===b){if(k&&"get"in k&&(g=k.get(a,!1,e))!==b)return g;return j[c]}h=typeof d,h==="string"&&(g=bu.exec(d))&&(d=+(g[1]+1)*+g[2]+parseFloat(f.css(a,c)),h="number");if(d==null||h==="number"&&isNaN(d))return;h==="number"&&!f.cssNumber[i]&&(d+="px");if(!k||!("set"in k)||(d=k.set(a,d))!==b)try{j[c]=d}catch(l){}}},css:function(a,c,d){var e,g;c=f.camelCase(c),g=f.cssHooks[c],c=f.cssProps[c]||c,c==="cssFloat"&&(c="float");if(g&&"get"in g&&(e=g.get(a,!0,d))!==b)return e;if(by)return by(a,c)},swap:function(a,b,c){var d={},e,f;for(f in b)d[f]=a.style[f],a.style[f]=b[f];e=c.call(a);for(f in b)a.style[f]=d[f];return e}}),f.curCSS=f.css,c.defaultView&&c.defaultView.getComputedStyle&&(bz=function(a,b){var c,d,e,g,h=a.style;b=b.replace(br,"-$1").toLowerCase(),(d=a.ownerDocument.defaultView)&&(e=d.getComputedStyle(a,null))&&(c=e.getPropertyValue(b),c===""&&!f.contains(a.ownerDocument.documentElement,a)&&(c=f.style(a,b))),!f.support.pixelMargin&&e&&bv.test(b)&&bt.test(c)&&(g=h.width,h.width=c,c=e.width,h.width=g);return c}),c.documentElement.currentStyle&&(bA=function(a,b){var c,d,e,f=a.currentStyle&&a.currentStyle[b],g=a.style;f==null&&g&&(e=g[b])&&(f=e),bt.test(f)&&(c=g.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),g.left=b==="fontSize"?"1em":f,f=g.pixelLeft+"px",g.left=c,d&&(a.runtimeStyle.left=d));return f===""?"auto":f}),by=bz||bA,f.each(["height","width"],function(a,b){f.cssHooks[b]={get:function(a,c,d){if(c)return a.offsetWidth!==0?bB(a,b,d):f.swap(a,bw,function(){return bB(a,b,d)})},set:function(a,b){return bs.test(b)?b+"px":b}}}),f.support.opacity||(f.cssHooks.opacity={get:function(a,b){return bq.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=f.isNumeric(b)?"alpha(opacity="+b*100+")":"",g=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&f.trim(g.replace(bp,""))===""){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bp.test(g)?g.replace(bp,e):g+" "+e}}),f(function(){f.support.reliableMarginRight||(f.cssHooks.marginRight={get:function(a,b){return f.swap(a,{display:"inline-block"},function(){return b?by(a,"margin-right"):a.style.marginRight})}})}),f.expr&&f.expr.filters&&(f.expr.filters.hidden=function(a){var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!f.support.reliableHiddenOffsets&&(a.style&&a.style.display||f.css(a,"display"))==="none"},f.expr.filters.visible=function(a){return!f.expr.filters.hidden(a)}),f.each({margin:"",padding:"",border:"Width"},function(a,b){f.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};for(d=0;d<4;d++)f[a+bx[d]+b]=e[d]||e[d-2]||e[0];return f}}});var bC=/%20/g,bD=/\[\]$/,bE=/\r?\n/g,bF=/#.*$/,bG=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bH=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bI=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,bJ=/^(?:GET|HEAD)$/,bK=/^\/\//,bL=/\?/,bM=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bN=/^(?:select|textarea)/i,bO=/\s+/,bP=/([?&])_=[^&]*/,bQ=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,bR=f.fn.load,bS={},bT={},bU,bV,bW=["*/"]+["*"];try{bU=e.href}catch(bX){bU=c.createElement("a"),bU.href="",bU=bU.href}bV=bQ.exec(bU.toLowerCase())||[],f.fn.extend({load:function(a,c,d){if(typeof a!="string"&&bR)return bR.apply(this,arguments);if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var g=a.slice(e,a.length);a=a.slice(0,e)}var h="GET";c&&(f.isFunction(c)?(d=c,c=b):typeof c=="object"&&(c=f.param(c,f.ajaxSettings.traditional),h="POST"));var i=this;f.ajax({url:a,type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){c=a}),i.html(g?f("<div>").append(c.replace(bM,"")).find(g):c)),d&&i.each(d,[c,b,a])}});return this},serialize:function(){return f.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?f.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||bN.test(this.nodeName)||bH.test(this.type))}).map(function(a,b){var c=f(this).val();return c==null?null:f.isArray(c)?f.map(c,function(a,c){return{name:b.name,value:a.replace(bE,"\r\n")}}):{name:b.name,value:c.replace(bE,"\r\n")}}).get()}}),f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){f.fn[b]=function(a){return this.on(b,a)}}),f.each(["get","post"],function(a,c){f[c]=function(a,d,e,g){f.isFunction(d)&&(g=g||e,e=d,d=b);return f.ajax({type:c,url:a,data:d,success:e,dataType:g})}}),f.extend({getScript:function(a,c){return f.get(a,b,c,"script")},getJSON:function(a,b,c){return f.get(a,b,c,"json")},ajaxSetup:function(a,b){b?b$(a,f.ajaxSettings):(b=a,a=f.ajaxSettings),b$(a,b);return a},ajaxSettings:{url:bU,isLocal:bI.test(bV[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":bW},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":f.parseJSON,"text xml":f.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:bY(bS),ajaxTransport:bY(bT),ajax:function(a,c){function w(a,c,l,m){if(s!==2){s=2,q&&clearTimeout(q),p=b,n=m||"",v.readyState=a>0?4:0;var o,r,u,w=c,x=l?ca(d,v,l):b,y,z;if(a>=200&&a<300||a===304){if(d.ifModified){if(y=v.getResponseHeader("Last-Modified"))f.lastModified[k]=y;if(z=v.getResponseHeader("Etag"))f.etag[k]=z}if(a===304)w="notmodified",o=!0;else try{r=cb(d,x),w="success",o=!0}catch(A){w="parsererror",u=A}}else{u=w;if(!w||a)w="error",a<0&&(a=0)}v.status=a,v.statusText=""+(c||w),o?h.resolveWith(e,[r,w,v]):h.rejectWith(e,[v,w,u]),v.statusCode(j),j=b,t&&g.trigger("ajax"+(o?"Success":"Error"),[v,d,o?r:u]),i.fireWith(e,[v,w]),t&&(g.trigger("ajaxComplete",[v,d]),--f.active||f.event.trigger("ajaxStop"))}}typeof a=="object"&&(c=a,a=b),c=c||{};var d=f.ajaxSetup({},c),e=d.context||d,g=e!==d&&(e.nodeType||e instanceof f)?f(e):f.event,h=f.Deferred(),i=f.Callbacks("once memory"),j=d.statusCode||{},k,l={},m={},n,o,p,q,r,s=0,t,u,v={readyState:0,setRequestHeader:function(a,b){if(!s){var c=a.toLowerCase();a=m[c]=m[c]||a,l[a]=b}return this},getAllResponseHeaders:function(){return s===2?n:null},getResponseHeader:function(a){var c;if(s===2){if(!o){o={};while(c=bG.exec(n))o[c[1].toLowerCase()]=c[2]}c=o[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){s||(d.mimeType=a);return this},abort:function(a){a=a||"abort",p&&p.abort(a),w(0,a);return this}};h.promise(v),v.success=v.done,v.error=v.fail,v.complete=i.add,v.statusCode=function(a){if(a){var b;if(s<2)for(b in a)j[b]=[j[b],a[b]];else b=a[v.status],v.then(b,b)}return this},d.url=((a||d.url)+"").replace(bF,"").replace(bK,bV[1]+"//"),d.dataTypes=f.trim(d.dataType||"*").toLowerCase().split(bO),d.crossDomain==null&&(r=bQ.exec(d.url.toLowerCase()),d.crossDomain=!(!r||r[1]==bV[1]&&r[2]==bV[2]&&(r[3]||(r[1]==="http:"?80:443))==(bV[3]||(bV[1]==="http:"?80:443)))),d.data&&d.processData&&typeof d.data!="string"&&(d.data=f.param(d.data,d.traditional)),bZ(bS,d,c,v);if(s===2)return!1;t=d.global,d.type=d.type.toUpperCase(),d.hasContent=!bJ.test(d.type),t&&f.active++===0&&f.event.trigger("ajaxStart");if(!d.hasContent){d.data&&(d.url+=(bL.test(d.url)?"&":"?")+d.data,delete d.data),k=d.url;if(d.cache===!1){var x=f.now(),y=d.url.replace(bP,"$1_="+x);d.url=y+(y===d.url?(bL.test(d.url)?"&":"?")+"_="+x:"")}}(d.data&&d.hasContent&&d.contentType!==!1||c.contentType)&&v.setRequestHeader("Content-Type",d.contentType),d.ifModified&&(k=k||d.url,f.lastModified[k]&&v.setRequestHeader("If-Modified-Since",f.lastModified[k]),f.etag[k]&&v.setRequestHeader("If-None-Match",f.etag[k])),v.setRequestHeader("Accept",d.dataTypes[0]&&d.accepts[d.dataTypes[0]]?d.accepts[d.dataTypes[0]]+(d.dataTypes[0]!=="*"?", "+bW+"; q=0.01":""):d.accepts["*"]);for(u in d.headers)v.setRequestHeader(u,d.headers[u]);if(d.beforeSend&&(d.beforeSend.call(e,v,d)===!1||s===2)){v.abort();return!1}for(u in{success:1,error:1,complete:1})v[u](d[u]);p=bZ(bT,d,c,v);if(!p)w(-1,"No Transport");else{v.readyState=1,t&&g.trigger("ajaxSend",[v,d]),d.async&&d.timeout>0&&(q=setTimeout(function(){v.abort("timeout")},d.timeout));try{s=1,p.send(l,w)}catch(z){if(s<2)w(-1,z);else throw z}}return v},param:function(a,c){var d=[],e=function(a,b){b=f.isFunction(b)?b():b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=f.ajaxSettings.traditional);if(f.isArray(a)||a.jquery&&!f.isPlainObject(a))f.each(a,function(){e(this.name,this.value)});else for(var g in a)b_(g,a[g],c,e);return d.join("&").replace(bC,"+")}}),f.extend({active:0,lastModified:{},etag:{}});var cc=f.now(),cd=/(\=)\?(&|$)|\?\?/i;f.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return f.expando+"_"+cc++}}),f.ajaxPrefilter("json jsonp",function(b,c,d){var e=typeof b.data=="string"&&/^application\/x\-www\-form\-urlencoded/.test(b.contentType);if(b.dataTypes[0]==="jsonp"||b.jsonp!==!1&&(cd.test(b.url)||e&&cd.test(b.data))){var g,h=b.jsonpCallback=f.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2";b.jsonp!==!1&&(j=j.replace(cd,l),b.url===j&&(e&&(k=k.replace(cd,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),b.url=j,b.data=k,a[h]=function(a){g=[a]},d.always(function(){a[h]=i,g&&f.isFunction(i)&&a[h](g[0])}),b.converters["script json"]=function(){g||f.error(h+" was not called");return g[0]},b.dataTypes[0]="json";return"script"}}),f.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){f.globalEval(a);return a}}}),f.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),f.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(c||!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){d&&d.onload(0,1)}}}});var ce=a.ActiveXObject?function(){for(var a in cg)cg[a](0,1)}:!1,cf=0,cg;f.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&ch()||ci()}:ch,function(a){f.extend(f.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(f.ajaxSettings.xhr()),f.support.ajax&&f.ajaxTransport(function(c){if(!c.crossDomain||f.support.cors){var d;return{send:function(e,g){var h=c.xhr(),i,j;c.username?h.open(c.type,c.url,c.async,c.username,c.password):h.open(c.type,c.url,c.async);if(c.xhrFields)for(j in c.xhrFields)h[j]=c.xhrFields[j];c.mimeType&&h.overrideMimeType&&h.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(j in e)h.setRequestHeader(j,e[j])}catch(k){}h.send(c.hasContent&&c.data||null),d=function(a,e){var j,k,l,m,n;try{if(d&&(e||h.readyState===4)){d=b,i&&(h.onreadystatechange=f.noop,ce&&delete cg[i]);if(e)h.readyState!==4&&h.abort();else{j=h.status,l=h.getAllResponseHeaders(),m={},n=h.responseXML,n&&n.documentElement&&(m.xml=n);try{m.text=h.responseText}catch(a){}try{k=h.statusText}catch(o){k=""}!j&&c.isLocal&&!c.crossDomain?j=m.text?200:404:j===1223&&(j=204)}}}catch(p){e||g(-1,p)}m&&g(j,k,m,l)},!c.async||h.readyState===4?d():(i=++cf,ce&&(cg||(cg={},f(a).unload(ce)),cg[i]=d),h.onreadystatechange=d)},abort:function(){d&&d(0,1)}}}});var cj={},ck,cl,cm=/^(?:toggle|show|hide)$/,cn=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,co,cp=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],cq;f.fn.extend({show:function(a,b,c){var d,e;if(a||a===0)return this.animate(ct("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)d=this[g],d.style&&(e=d.style.display,!f._data(d,"olddisplay")&&e==="none"&&(e=d.style.display=""),(e===""&&f.css(d,"display")==="none"||!f.contains(d.ownerDocument.documentElement,d))&&f._data(d,"olddisplay",cu(d.nodeName)));for(g=0;g<h;g++){d=this[g];if(d.style){e=d.style.display;if(e===""||e==="none")d.style.display=f._data(d,"olddisplay")||""}}return this},hide:function(a,b,c){if(a||a===0)return this.animate(ct("hide",3),a,b,c);var d,e,g=0,h=this.length;for(;g<h;g++)d=this[g],d.style&&(e=f.css(d,"display"),e!=="none"&&!f._data(d,"olddisplay")&&f._data(d,"olddisplay",e));for(g=0;g<h;g++)this[g].style&&(this[g].style.display="none");return this},_toggle:f.fn.toggle,toggle:function(a,b,c){var d=typeof a=="boolean";f.isFunction(a)&&f.isFunction(b)?this._toggle.apply(this,arguments):a==null||d?this.each(function(){var b=d?a:f(this).is(":hidden");f(this)[b?"show":"hide"]()}):this.animate(ct("toggle",3),a,b,c);return this},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){function g(){e.queue===!1&&f._mark(this);var b=f.extend({},e),c=this.nodeType===1,d=c&&f(this).is(":hidden"),g,h,i,j,k,l,m,n,o,p,q;b.animatedProperties={};for(i in a){g=f.camelCase(i),i!==g&&(a[g]=a[i],delete a[i]);if((k=f.cssHooks[g])&&"expand"in k){l=k.expand(a[g]),delete a[g];for(i in l)i in a||(a[i]=l[i])}}for(g in a){h=a[g],f.isArray(h)?(b.animatedProperties[g]=h[1],h=a[g]=h[0]):b.animatedProperties[g]=b.specialEasing&&b.specialEasing[g]||b.easing||"swing";if(h==="hide"&&d||h==="show"&&!d)return b.complete.call(this);c&&(g==="height"||g==="width")&&(b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY],f.css(this,"display")==="inline"&&f.css(this,"float")==="none"&&(!f.support.inlineBlockNeedsLayout||cu(this.nodeName)==="inline"?this.style.display="inline-block":this.style.zoom=1))}b.overflow!=null&&(this.style.overflow="hidden");for(i in a)j=new f.fx(this,b,i),h=a[i],cm.test(h)?(q=f._data(this,"toggle"+i)||(h==="toggle"?d?"show":"hide":0),q?(f._data(this,"toggle"+i,q==="show"?"hide":"show"),j[q]()):j[h]()):(m=cn.exec(h),n=j.cur(),m?(o=parseFloat(m[2]),p=m[3]||(f.cssNumber[i]?"":"px"),p!=="px"&&(f.style(this,i,(o||1)+p),n=(o||1)/j.cur()*n,f.style(this,i,n+p)),m[1]&&(o=(m[1]==="-="?-1:1)*o+n),j.custom(n,o,p)):j.custom(n,h,""));return!0}var e=f.speed(b,c,d);if(f.isEmptyObject(a))return this.each(e.complete,[!1]);a=f.extend({},a);return e.queue===!1?this.each(g):this.queue(e.queue,g)},stop:function(a,c,d){typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]);return this.each(function(){function h(a,b,c){var e=b[c];f.removeData(a,c,!0),e.stop(d)}var b,c=!1,e=f.timers,g=f._data(this);d||f._unmark(!0,this);if(a==null)for(b in g)g[b]&&g[b].stop&&b.indexOf(".run")===b.length-4&&h(this,g,b);else g[b=a+".run"]&&g[b].stop&&h(this,g,b);for(b=e.length;b--;)e[b].elem===this&&(a==null||e[b].queue===a)&&(d?e[b](!0):e[b].saveState(),c=!0,e.splice(b,1));(!d||!c)&&f.dequeue(this,a)})}}),f.each({slideDown:ct("show",1),slideUp:ct("hide",1),slideToggle:ct("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){f.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),f.extend({speed:function(a,b,c){var d=a&&typeof a=="object"?f.extend({},a):{complete:c||!c&&b||f.isFunction(a)&&a,duration:a,easing:c&&b||b&&!f.isFunction(b)&&b};d.duration=f.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in f.fx.speeds?f.fx.speeds[d.duration]:f.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";d.old=d.complete,d.complete=function(a){f.isFunction(d.old)&&d.old.call(this),d.queue?f.dequeue(this,d.queue):a!==!1&&f._unmark(this)};return d},easing:{linear:function(a){return a},swing:function(a){return-Math.cos(a*Math.PI)/2+.5}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,this.prop=c,b.orig=b.orig||{}}}),f.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(f.fx.step[this.prop]||f.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=f.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,c,d){function h(a){return e.step(a)}var e=this,g=f.fx;this.startTime=cq||cr(),this.end=c,this.now=this.start=a,this.pos=this.state=0,this.unit=d||this.unit||(f.cssNumber[this.prop]?"":"px"),h.queue=this.options.queue,h.elem=this.elem,h.saveState=function(){f._data(e.elem,"fxshow"+e.prop)===b&&(e.options.hide?f._data(e.elem,"fxshow"+e.prop,e.start):e.options.show&&f._data(e.elem,"fxshow"+e.prop,e.end))},h()&&f.timers.push(h)&&!co&&(co=setInterval(g.tick,g.interval))},show:function(){var a=f._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=a||f.style(this.elem,this.prop),this.options.show=!0,a!==b?this.custom(this.cur(),a):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),f(this.elem).show()},hide:function(){this.options.orig[this.prop]=f._data(this.elem,"fxshow"+this.prop)||f.style(this.elem,this.prop),this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b,c,d,e=cq||cr(),g=!0,h=this.elem,i=this.options;if(a||e>=i.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),i.animatedProperties[this.prop]=!0;for(b in i.animatedProperties)i.animatedProperties[b]!==!0&&(g=!1);if(g){i.overflow!=null&&!f.support.shrinkWrapBlocks&&f.each(["","X","Y"],function(a,b){h.style["overflow"+b]=i.overflow[a]}),i.hide&&f(h).hide();if(i.hide||i.show)for(b in i.animatedProperties)f.style(h,b,i.orig[b]),f.removeData(h,"fxshow"+b,!0),f.removeData(h,"toggle"+b,!0);d=i.complete,d&&(i.complete=!1,d.call(h))}return!1}i.duration==Infinity?this.now=e:(c=e-this.startTime,this.state=c/i.duration,this.pos=f.easing[i.animatedProperties[this.prop]](this.state,c,0,1,i.duration),this.now=this.start+(this.end-this.start)*this.pos),this.update();return!0}},f.extend(f.fx,{tick:function(){var a,b=f.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||f.fx.stop()},interval:13,stop:function(){clearInterval(co),co=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){f.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=a.now+a.unit:a.elem[a.prop]=a.now}}}),f.each(cp.concat.apply([],cp),function(a,b){b.indexOf("margin")&&(f.fx.step[b]=function(a){f.style(a.elem,b,Math.max(0,a.now)+a.unit)})}),f.expr&&f.expr.filters&&(f.expr.filters.animated=function(a){return f.grep(f.timers,function(b){return a===b.elem}).length});var cv,cw=/^t(?:able|d|h)$/i,cx=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?cv=function(a,b,c,d){try{d=a.getBoundingClientRect()}catch(e){}if(!d||!f.contains(c,a))return d?{top:d.top,left:d.left}:{top:0,left:0};var g=b.body,h=cy(b),i=c.clientTop||g.clientTop||0,j=c.clientLeft||g.clientLeft||0,k=h.pageYOffset||f.support.boxModel&&c.scrollTop||g.scrollTop,l=h.pageXOffset||f.support.boxModel&&c.scrollLeft||g.scrollLeft,m=d.top+k-i,n=d.left+l-j;return{top:m,left:n}}:cv=function(a,b,c){var d,e=a.offsetParent,g=a,h=b.body,i=b.defaultView,j=i?i.getComputedStyle(a,null):a.currentStyle,k=a.offsetTop,l=a.offsetLeft;while((a=a.parentNode)&&a!==h&&a!==c){if(f.support.fixedPosition&&j.position==="fixed")break;d=i?i.getComputedStyle(a,null):a.currentStyle,k-=a.scrollTop,l-=a.scrollLeft,a===e&&(k+=a.offsetTop,l+=a.offsetLeft,f.support.doesNotAddBorder&&(!f.support.doesAddBorderForTableAndCells||!cw.test(a.nodeName))&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),g=e,e=a.offsetParent),f.support.subtractsBorderForOverflowNotVisible&&d.overflow!=="visible"&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),j=d}if(j.position==="relative"||j.position==="static")k+=h.offsetTop,l+=h.offsetLeft;f.support.fixedPosition&&j.position==="fixed"&&(k+=Math.max(c.scrollTop,h.scrollTop),l+=Math.max(c.scrollLeft,h.scrollLeft));return{top:k,left:l}},f.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){f.offset.setOffset(this,a,b)});var c=this[0],d=c&&c.ownerDocument;if(!d)return null;if(c===d.body)return f.offset.bodyOffset(c);return cv(c,d,d.documentElement)},f.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;f.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(f.css(a,"marginTop"))||0,c+=parseFloat(f.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var d=f.css(a,"position");d==="static"&&(a.style.position="relative");var e=f(a),g=e.offset(),h=f.css(a,"top"),i=f.css(a,"left"),j=(d==="absolute"||d==="fixed")&&f.inArray("auto",[h,i])>-1,k={},l={},m,n;j?(l=e.position(),m=l.top,n=l.left):(m=parseFloat(h)||0,n=parseFloat(i)||0),f.isFunction(b)&&(b=b.call(a,c,g)),b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):e.css(k)}},f.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),d=cx.test(b[0].nodeName)?{top:0,left:0}:b.offset();c.top-=parseFloat(f.css(a,"marginTop"))||0,c.left-=parseFloat(f.css(a,"marginLeft"))||0,d.top+=parseFloat(f.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(f.css(b[0],"borderLeftWidth"))||0;return{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;while(a&&!cx.test(a.nodeName)&&f.css(a,"position")==="static")a=a.offsetParent;return a})}}),f.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);f.fn[a]=function(e){return f.access(this,function(a,e,g){var h=cy(a);if(g===b)return h?c in h?h[c]:f.support.boxModel&&h.document.documentElement[e]||h.document.body[e]:a[e];h?h.scrollTo(d?f(h).scrollLeft():g,d?g:f(h).scrollTop()):a[e]=g},a,e,arguments.length,null)}}),f.each({Height:"height",Width:"width"},function(a,c){var d="client"+a,e="scroll"+a,g="offset"+a;f.fn["inner"+a]=function(){var a=this[0];return a?a.style?parseFloat(f.css(a,c,"padding")):this[c]():null},f.fn["outer"+a]=function(a){var b=this[0];return b?b.style?parseFloat(f.css(b,c,a?"margin":"border")):this[c]():null},f.fn[c]=function(a){return f.access(this,function(a,c,h){var i,j,k,l;if(f.isWindow(a)){i=a.document,j=i.documentElement[d];return f.support.boxModel&&j||i.body&&i.body[d]||j}if(a.nodeType===9){i=a.documentElement;if(i[d]>=i[e])return i[d];return Math.max(a.body[e],i[e],a.body[g],i[g])}if(h===b){k=f.css(a,c),l=parseFloat(k);return f.isNumeric(l)?l:k}f(a).css(c,h)},c,a,arguments.length,null)}}),a.jQuery=a.$=f,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return f})})(window); 






// end






/*
 * pasting jQuery right into the script for speed and security reasons 
 * if you're worried whether there's anything nefarious in there, just 
 * delete everything below this and replace it with a new copy fresh
 * from jquery.com. i used 1.7.2 in development so I can't guarantee 
 * any other version * will work
 */





/* jquery color plugin minified */
/* downloaded from here: https://github.com/jquery/jquery-color */
(function(jQuery,undefined){var stepHooks="backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color outlineColor".split(" "),rplusequals=/^([\-+])=\s*(\d+\.?\d*)/,stringParsers=[{re:/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,parse:function(execResult){return[execResult[1],execResult[2],execResult[3],execResult[4]]}},{re:/rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,parse:function(execResult){return[2.55*execResult[1],2.55*execResult[2],2.55*execResult[3],execResult[4]]}},{re:/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,parse:function(execResult){return[parseInt(execResult[1],16),parseInt(execResult[2],16),parseInt(execResult[3],16)]}},{re:/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,parse:function(execResult){return[parseInt(execResult[1]+execResult[1],16),parseInt(execResult[2]+execResult[2],16),parseInt(execResult[3]+execResult[3],16)]}},{re:/hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,space:"hsla",parse:function(execResult){return[execResult[1],execResult[2]/100,execResult[3]/100,execResult[4]]}}],color=jQuery.Color=function(color,green,blue,alpha){return new jQuery.Color.fn.parse(color,green,blue,alpha)},spaces={rgba:{cache:"_rgba",props:{red:{idx:0,type:"byte",empty:true},green:{idx:1,type:"byte",empty:true},blue:{idx:2,type:"byte",empty:true},alpha:{idx:3,type:"percent",def:1}}},hsla:{cache:"_hsla",props:{hue:{idx:0,type:"degrees",empty:true},saturation:{idx:1,type:"percent",empty:true},lightness:{idx:2,type:"percent",empty:true}}}},propTypes={"byte":{floor:true,min:0,max:255},"percent":{min:0,max:1},"degrees":{mod:360,floor:true}},rgbaspace=spaces.rgba.props,support=color.support={},colors,each=jQuery.each;spaces.hsla.props.alpha=rgbaspace.alpha;function clamp(value,prop,alwaysAllowEmpty){var type=propTypes[prop.type]||{},allowEmpty=prop.empty||alwaysAllowEmpty;if(allowEmpty&&value==null){return null}if(prop.def&&value==null){return prop.def}if(type.floor){value=~~value}else{value=parseFloat(value)}if(value==null||isNaN(value)){return prop.def}if(type.mod){value=value%type.mod;return value<0?type.mod+value:value}return type.min>value?type.min:type.max<value?type.max:value}function stringParse(string){var inst=color(),rgba=inst._rgba=[];string=string.toLowerCase();each(stringParsers,function(i,parser){var match=parser.re.exec(string),values=match&&parser.parse(match),parsed,spaceName=parser.space||"rgba",cache=spaces[spaceName].cache;if(values){parsed=inst[spaceName](values);inst[cache]=parsed[cache];rgba=inst._rgba=parsed._rgba;return false}});if(rgba.length!==0){if(Math.max.apply(Math,rgba)===0){jQuery.extend(rgba,colors.transparent)}return inst}if(string=colors[string]){return string}}color.fn=color.prototype={constructor:color,parse:function(red,green,blue,alpha){if(red===undefined){this._rgba=[null,null,null,null];return this}if(red instanceof jQuery||red.nodeType){red=red instanceof jQuery?red.css(green):jQuery(red).css(green);green=undefined}var inst=this,type=jQuery.type(red),rgba=this._rgba=[],source;if(green!==undefined){red=[red,green,blue,alpha];type="array"}if(type==="string"){return this.parse(stringParse(red)||colors._default)}if(type==="array"){each(rgbaspace,function(key,prop){rgba[prop.idx]=clamp(red[prop.idx],prop)});return this}if(type==="object"){if(red instanceof color){each(spaces,function(spaceName,space){if(red[space.cache]){inst[space.cache]=red[space.cache].slice()}})}else{each(spaces,function(spaceName,space){each(space.props,function(key,prop){var cache=space.cache;if(!inst[cache]&&space.to){if(red[key]==null||key==="alpha"){return}inst[cache]=space.to(inst._rgba)}inst[cache][prop.idx]=clamp(red[key],prop,true)})})}return this}},is:function(compare){var is=color(compare),same=true,myself=this;each(spaces,function(_,space){var isCache=is[space.cache],localCache;if(isCache){localCache=myself[space.cache]||space.to&&space.to(myself._rgba)||[];each(space.props,function(_,prop){if(isCache[prop.idx]!=null){same=(isCache[prop.idx]===localCache[prop.idx]);return same}})}return same});return same},_space:function(){var used=[],inst=this;each(spaces,function(spaceName,space){if(inst[space.cache]){used.push(spaceName)}});return used.pop()},transition:function(other,distance){var end=color(other),spaceName=end._space(),space=spaces[spaceName],start=this[space.cache]||space.to(this._rgba),result=start.slice();end=end[space.cache];each(space.props,function(key,prop){var index=prop.idx,startValue=start[index],endValue=end[index],type=propTypes[prop.type]||{};if(endValue===null){return}if(startValue===null){result[index]=endValue}else{if(type.mod){if(endValue-startValue>type.mod/2){startValue+=type.mod}else if(startValue-endValue>type.mod/2){startValue-=type.mod}}result[prop.idx]=clamp((endValue-startValue)*distance+startValue,prop)}});return this[spaceName](result)},blend:function(opaque){if(this._rgba[3]===1){return this}var rgb=this._rgba.slice(),a=rgb.pop(),blend=color(opaque)._rgba;return color(jQuery.map(rgb,function(v,i){return(1-a)*blend[i]+a*v}))},toRgbaString:function(){var prefix="rgba(",rgba=jQuery.map(this._rgba,function(v,i){return v==null?(i>2?1:0):v});if(rgba[3]===1){rgba.pop();prefix="rgb("}return prefix+rgba.join(",")+")"},toHslaString:function(){var prefix="hsla(",hsla=jQuery.map(this.hsla(),function(v,i){if(v==null){v=i>2?1:0}if(i&&i<3){v=Math.round(v*100)+"%"}return v});if(hsla[3]===1){hsla.pop();prefix="hsl("}return prefix+hsla.join(",")+")"},toHexString:function(includeAlpha){var rgba=this._rgba.slice(),alpha=rgba.pop();if(includeAlpha){rgba.push(~~(alpha*255))}return"#"+jQuery.map(rgba,function(v,i){v=(v||0).toString(16);return v.length===1?"0"+v:v}).join("")},toString:function(){return this._rgba[3]===0?"transparent":this.toRgbaString()}};color.fn.parse.prototype=color.fn;function hue2rgb(p,q,h){h=(h+1)%1;if(h*6<1){return p+(q-p)*6*h}if(h*2<1){return q}if(h*3<2){return p+(q-p)*((2/3)-h)*6}return p}spaces.hsla.to=function(rgba){if(rgba[0]==null||rgba[1]==null||rgba[2]==null){return[null,null,null,rgba[3]]}var r=rgba[0]/255,g=rgba[1]/255,b=rgba[2]/255,a=rgba[3],max=Math.max(r,g,b),min=Math.min(r,g,b),diff=max-min,add=max+min,l=add*0.5,h,s;if(min===max){h=0}else if(r===max){h=(60*(g-b)/diff)+360}else if(g===max){h=(60*(b-r)/diff)+120}else{h=(60*(r-g)/diff)+240}if(l===0||l===1){s=l}else if(l<=0.5){s=diff/add}else{s=diff/(2-add)}return[Math.round(h)%360,s,l,a==null?1:a]};spaces.hsla.from=function(hsla){if(hsla[0]==null||hsla[1]==null||hsla[2]==null){return[null,null,null,hsla[3]]}var h=hsla[0]/360,s=hsla[1],l=hsla[2],a=hsla[3],q=l<=0.5?l*(1+s):l+s-l*s,p=2*l-q,r,g,b;return[Math.round(hue2rgb(p,q,h+(1/3))*255),Math.round(hue2rgb(p,q,h)*255),Math.round(hue2rgb(p,q,h-(1/3))*255),a]};each(spaces,function(spaceName,space){var props=space.props,cache=space.cache,to=space.to,from=space.from;color.fn[spaceName]=function(value){if(to&&!this[cache]){this[cache]=to(this._rgba)}if(value===undefined){return this[cache].slice()}var type=jQuery.type(value),arr=(type==="array"||type==="object")?value:arguments,local=this[cache].slice(),ret;each(props,function(key,prop){var val=arr[type==="object"?key:prop.idx];if(val==null){val=local[prop.idx]}local[prop.idx]=clamp(val,prop)});if(from){ret=color(from(local));ret[cache]=local;return ret}else{return color(local)}};each(props,function(key,prop){if(color.fn[key]){return}color.fn[key]=function(value){var vtype=jQuery.type(value),fn=(key==='alpha'?(this._hsla?'hsla':'rgba'):spaceName),local=this[fn](),cur=local[prop.idx],match;if(vtype==="undefined"){return cur}if(vtype==="function"){value=value.call(this,cur);vtype=jQuery.type(value)}if(value==null&&prop.empty){return this}if(vtype==="string"){match=rplusequals.exec(value);if(match){value=cur+parseFloat(match[2])*(match[1]==="+"?1:-1)}}local[prop.idx]=value;return this[fn](local)}})});each(stepHooks,function(i,hook){jQuery.cssHooks[hook]={set:function(elem,value){var parsed,backgroundColor,curElem;if(jQuery.type(value)!=='string'||(parsed=stringParse(value))){value=color(parsed||value);if(!support.rgba&&value._rgba[3]!==1){curElem=hook==="backgroundColor"?elem.parentNode:elem;do{backgroundColor=jQuery.curCSS(curElem,"backgroundColor")}while((backgroundColor===""||backgroundColor==="transparent")&&(curElem=curElem.parentNode)&&curElem.style);value=value.blend(backgroundColor&&backgroundColor!=="transparent"?backgroundColor:"_default")}value=value.toRgbaString()}try{elem.style[hook]=value}catch(value){}}};jQuery.fx.step[hook]=function(fx){if(!fx.colorInit){fx.start=color(fx.elem,hook);fx.end=color(fx.end);fx.colorInit=true}jQuery.cssHooks[hook].set(fx.elem,fx.start.transition(fx.end,fx.pos))}});jQuery(function(){var div=document.createElement("div"),div_style=div.style;div_style.cssText="background-color:rgba(1,1,1,.5)";support.rgba=div_style.backgroundColor.indexOf("rgba")>-1});colors=jQuery.Color.names={aqua:"#00ffff",azure:"#f0ffff",beige:"#f5f5dc",black:"#000000",blue:"#0000ff",brown:"#a52a2a",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgrey:"#a9a9a9",darkgreen:"#006400",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkviolet:"#9400d3",fuchsia:"#ff00ff",gold:"#ffd700",green:"#008000",indigo:"#4b0082",khaki:"#f0e68c",lightblue:"#add8e6",lightcyan:"#e0ffff",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightpink:"#ffb6c1",lightyellow:"#ffffe0",lime:"#00ff00",magenta:"#ff00ff",maroon:"#800000",navy:"#000080",olive:"#808000",orange:"#ffa500",pink:"#ffc0cb",purple:"#800080",violet:"#800080",red:"#ff0000",silver:"#c0c0c0",white:"#ffffff",yellow:"#ffff00",transparent:[null,null,null,0],_default:"#ffffff"}})(jQuery);

/*
 * SimpleModal 1.4.2 - jQuery Plugin
 * http://simplemodal.com/
 * Copyright (c) 2011 Eric Martin
 * Licensed under MIT and GPL
 * Date: Sat, Dec 17 2011 15:35:38 -0800
 */
(function(b){"function"===typeof define&&define.amd?define(["jquery"],b):b(jQuery)})(function(b){var j=[],k=b(document),l=b.browser.msie&&6===parseInt(b.browser.version)&&"object"!==typeof window.XMLHttpRequest,n=b.browser.msie&&7===parseInt(b.browser.version),m=null,h=b(window),i=[];b.modal=function(a,d){return b.modal.impl.init(a,d)};b.modal.close=function(){b.modal.impl.close()};b.modal.focus=function(a){b.modal.impl.focus(a)};b.modal.setContainerDimensions=function(){b.modal.impl.setContainerDimensions()};
b.modal.setPosition=function(){b.modal.impl.setPosition()};b.modal.update=function(a,d){b.modal.impl.update(a,d)};b.fn.modal=function(a){return b.modal.impl.init(this,a)};b.modal.defaults={appendTo:"body",focus:!0,opacity:50,overlayId:"simplemodal-overlay",overlayCss:{},containerId:"simplemodal-container",containerCss:{},dataId:"simplemodal-data",dataCss:{},minHeight:null,minWidth:null,maxHeight:null,maxWidth:null,autoResize:!1,autoPosition:!0,zIndex:1E3,close:!0,closeHTML:'<a class="modalCloseImg" title="Close"></a>',
closeClass:"simplemodal-close",escClose:!0,overlayClose:!1,fixed:!0,position:null,persist:!1,modal:!0,onOpen:null,onShow:null,onClose:null};b.modal.impl={d:{},init:function(a,d){if(this.d.data)return!1;m=b.browser.msie&&!b.boxModel;this.o=b.extend({},b.modal.defaults,d);this.zIndex=this.o.zIndex;this.occb=!1;if("object"===typeof a){if(a=a instanceof jQuery?a:b(a),this.d.placeholder=!1,0<a.parent().parent().size()&&(a.before(b("<span></span>").attr("id","simplemodal-placeholder").css({display:"none"})),
this.d.placeholder=!0,this.display=a.css("display"),!this.o.persist))this.d.orig=a.clone(!0)}else if("string"===typeof a||"number"===typeof a)a=b("<div></div>").html(a);else return alert("SimpleModal Error: Unsupported data type: "+typeof a),this;this.create(a);this.open();b.isFunction(this.o.onShow)&&this.o.onShow.apply(this,[this.d]);return this},create:function(a){this.getDimensions();if(this.o.modal&&l)this.d.iframe=b('<iframe src="javascript:false;"></iframe>').css(b.extend(this.o.iframeCss,
{display:"none",opacity:0,position:"fixed",height:i[0],width:i[1],zIndex:this.o.zIndex,top:0,left:0})).appendTo(this.o.appendTo);this.d.overlay=b("<div></div>").attr("id",this.o.overlayId).addClass("simplemodal-overlay").css(b.extend(this.o.overlayCss,{display:"none",opacity:this.o.opacity/100,height:this.o.modal?j[0]:0,width:this.o.modal?j[1]:0,position:"fixed",left:0,top:0,zIndex:this.o.zIndex+1})).appendTo(this.o.appendTo);this.d.container=b("<div></div>").attr("id",this.o.containerId).addClass("simplemodal-container").css(b.extend({position:this.o.fixed?
"fixed":"absolute"},this.o.containerCss,{display:"none",zIndex:this.o.zIndex+2})).append(this.o.close&&this.o.closeHTML?b(this.o.closeHTML).addClass(this.o.closeClass):"").appendTo(this.o.appendTo);this.d.wrap=b("<div></div>").attr("tabIndex",-1).addClass("simplemodal-wrap").css({height:"100%",outline:0,width:"100%"}).appendTo(this.d.container);this.d.data=a.attr("id",a.attr("id")||this.o.dataId).addClass("simplemodal-data").css(b.extend(this.o.dataCss,{display:"none"})).appendTo("body");this.setContainerDimensions();
this.d.data.appendTo(this.d.wrap);(l||m)&&this.fixIE()},bindEvents:function(){var a=this;b("."+a.o.closeClass).bind("click.simplemodal",function(b){b.preventDefault();a.close()});a.o.modal&&a.o.close&&a.o.overlayClose&&a.d.overlay.bind("click.simplemodal",function(b){b.preventDefault();a.close()});k.bind("keydown.simplemodal",function(b){a.o.modal&&9===b.keyCode?a.watchTab(b):a.o.close&&a.o.escClose&&27===b.keyCode&&(b.preventDefault(),a.close())});h.bind("resize.simplemodal orientationchange.simplemodal",
function(){a.getDimensions();a.o.autoResize?a.setContainerDimensions():a.o.autoPosition&&a.setPosition();l||m?a.fixIE():a.o.modal&&(a.d.iframe&&a.d.iframe.css({height:i[0],width:i[1]}),a.d.overlay.css({height:j[0],width:j[1]}))})},unbindEvents:function(){b("."+this.o.closeClass).unbind("click.simplemodal");k.unbind("keydown.simplemodal");h.unbind(".simplemodal");this.d.overlay.unbind("click.simplemodal")},fixIE:function(){var a=this.o.position;b.each([this.d.iframe||null,!this.o.modal?null:this.d.overlay,
"fixed"===this.d.container.css("position")?this.d.container:null],function(b,f){if(f){var g=f[0].style;g.position="absolute";if(2>b)g.removeExpression("height"),g.removeExpression("width"),g.setExpression("height",'document.body.scrollHeight > document.body.clientHeight ? document.body.scrollHeight : document.body.clientHeight + "px"'),g.setExpression("width",'document.body.scrollWidth > document.body.clientWidth ? document.body.scrollWidth : document.body.clientWidth + "px"');else{var c,e;a&&a.constructor===
Array?(c=a[0]?"number"===typeof a[0]?a[0].toString():a[0].replace(/px/,""):f.css("top").replace(/px/,""),c=-1===c.indexOf("%")?c+' + (t = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"':parseInt(c.replace(/%/,""))+' * ((document.documentElement.clientHeight || document.body.clientHeight) / 100) + (t = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"',a[1]&&(e="number"===typeof a[1]?
a[1].toString():a[1].replace(/px/,""),e=-1===e.indexOf("%")?e+' + (t = document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft) + "px"':parseInt(e.replace(/%/,""))+' * ((document.documentElement.clientWidth || document.body.clientWidth) / 100) + (t = document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft) + "px"')):(c='(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (t = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"',
e='(document.documentElement.clientWidth || document.body.clientWidth) / 2 - (this.offsetWidth / 2) + (t = document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft) + "px"');g.removeExpression("top");g.removeExpression("left");g.setExpression("top",c);g.setExpression("left",e)}}})},focus:function(a){var d=this,a=a&&-1!==b.inArray(a,["first","last"])?a:"first",f=b(":input:enabled:visible:"+a,d.d.wrap);setTimeout(function(){0<f.length?f.focus():d.d.wrap.focus()},
10)},getDimensions:function(){var a=b.browser.opera&&"9.5"<b.browser.version&&"1.3">b.fn.jquery||b.browser.opera&&"9.5">b.browser.version&&"1.2.6"<b.fn.jquery?h[0].innerHeight:h.height();j=[k.height(),k.width()];i=[a,h.width()]},getVal:function(a,b){return a?"number"===typeof a?a:"auto"===a?0:0<a.indexOf("%")?parseInt(a.replace(/%/,""))/100*("h"===b?i[0]:i[1]):parseInt(a.replace(/px/,"")):null},update:function(a,b){if(!this.d.data)return!1;this.d.origHeight=this.getVal(a,"h");this.d.origWidth=this.getVal(b,
"w");this.d.data.hide();a&&this.d.container.css("height",a);b&&this.d.container.css("width",b);this.setContainerDimensions();this.d.data.show();this.o.focus&&this.focus();this.unbindEvents();this.bindEvents()},setContainerDimensions:function(){var a=l||n,d=this.d.origHeight?this.d.origHeight:b.browser.opera?this.d.container.height():this.getVal(a?this.d.container[0].currentStyle.height:this.d.container.css("height"),"h"),a=this.d.origWidth?this.d.origWidth:b.browser.opera?this.d.container.width():
this.getVal(a?this.d.container[0].currentStyle.width:this.d.container.css("width"),"w"),f=this.d.data.outerHeight(!0),g=this.d.data.outerWidth(!0);this.d.origHeight=this.d.origHeight||d;this.d.origWidth=this.d.origWidth||a;var c=this.o.maxHeight?this.getVal(this.o.maxHeight,"h"):null,e=this.o.maxWidth?this.getVal(this.o.maxWidth,"w"):null,c=c&&c<i[0]?c:i[0],e=e&&e<i[1]?e:i[1],h=this.o.minHeight?this.getVal(this.o.minHeight,"h"):"auto",d=d?this.o.autoResize&&d>c?c:d<h?h:d:f?f>c?c:this.o.minHeight&&
"auto"!==h&&f<h?h:f:h,c=this.o.minWidth?this.getVal(this.o.minWidth,"w"):"auto",a=a?this.o.autoResize&&a>e?e:a<c?c:a:g?g>e?e:this.o.minWidth&&"auto"!==c&&g<c?c:g:c;this.d.container.css({height:d,width:a});this.d.wrap.css({overflow:f>d||g>a?"auto":"visible"});this.o.autoPosition&&this.setPosition()},setPosition:function(){var a,b;a=i[0]/2-this.d.container.outerHeight(!0)/2;b=i[1]/2-this.d.container.outerWidth(!0)/2;var f="fixed"!==this.d.container.css("position")?h.scrollTop():0;this.o.position&&"[object Array]"===
Object.prototype.toString.call(this.o.position)?(a=f+(this.o.position[0]||a),b=this.o.position[1]||b):a=f+a;this.d.container.css({left:b,top:a})},watchTab:function(a){if(0<b(a.target).parents(".simplemodal-container").length){if(this.inputs=b(":input:enabled:visible:first, :input:enabled:visible:last",this.d.data[0]),!a.shiftKey&&a.target===this.inputs[this.inputs.length-1]||a.shiftKey&&a.target===this.inputs[0]||0===this.inputs.length)a.preventDefault(),this.focus(a.shiftKey?"last":"first")}else a.preventDefault(),
this.focus()},open:function(){this.d.iframe&&this.d.iframe.show();b.isFunction(this.o.onOpen)?this.o.onOpen.apply(this,[this.d]):(this.d.overlay.show(),this.d.container.show(),this.d.data.show());this.o.focus&&this.focus();this.bindEvents()},close:function(){if(!this.d.data)return!1;this.unbindEvents();if(b.isFunction(this.o.onClose)&&!this.occb)this.occb=!0,this.o.onClose.apply(this,[this.d]);else{if(this.d.placeholder){var a=b("#simplemodal-placeholder");this.o.persist?a.replaceWith(this.d.data.removeClass("simplemodal-data").css("display",
this.display)):(this.d.data.hide().remove(),a.replaceWith(this.d.orig))}else this.d.data.hide().remove();this.d.container.hide().remove();this.d.overlay.hide();this.d.iframe&&this.d.iframe.hide().remove();this.d.overlay.remove();this.d={}}}}});



// jeresig jquery.hotkeys
// https://github.com/jeresig/jquery.hotkeys

(function(a){function b(b){if(typeof b.data!=="string"){return}var c=b.handler,d=b.data.toLowerCase().split(" ");b.handler=function(b){if(this!==b.target&&(/textarea|select/i.test(b.target.nodeName)||b.target.type==="text")){return}var e=b.type!=="keypress"&&a.hotkeys.specialKeys[b.which],f=String.fromCharCode(b.which).toLowerCase(),g,h="",i={};if(b.altKey&&e!=="alt"){h+="alt+"}if(b.ctrlKey&&e!=="ctrl"){h+="ctrl+"}if(b.metaKey&&!b.ctrlKey&&e!=="meta"){h+="meta+"}if(b.shiftKey&&e!=="shift"){h+="shift+"}if(e){i[h+e]=true}else{i[h+f]=true;i[h+a.hotkeys.shiftNums[f]]=true;if(h==="shift+"){i[a.hotkeys.shiftNums[f]]=true}}for(var j=0,k=d.length;j<k;j++){if(i[d[j]]){return c.apply(this,arguments)}}}}a.hotkeys={version:"0.8",specialKeys:{8:"backspace",9:"tab",13:"return",16:"shift",17:"ctrl",18:"alt",19:"pause",20:"capslock",27:"esc",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",45:"insert",46:"del",96:"0",97:"1",98:"2",99:"3",100:"4",101:"5",102:"6",103:"7",104:"8",105:"9",106:"*",107:"+",109:"-",110:".",111:"/",112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",121:"f10",122:"f11",123:"f12",144:"numlock",145:"scroll",191:"/",224:"meta"},shiftNums:{"`":"~",1:"!",2:"@",3:"#",4:"$",5:"%",6:"^",7:"&",8:"*",9:"(",0:")","-":"_","=":"+",";":": ","'":'"',",":"<",".":">","/":"?","\\":"|"}};a.each(["keydown","keyup","keypress"],function(){a.event.special[this]={add:b}})})(jQuery)





// launch with the main once the script loads
main();


// DEMETRICATOR END

